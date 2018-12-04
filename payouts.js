const smartholdemApi = require("sthjs-wrapper");
const moment = require("moment");
const BigNumber = require("bignumber.js");
const scheduler = require("node-schedule");
const util = require("./api/util");
const request = require("request");
const level = require("level");
const jsonfile = require('jsonfile');
const forgedFile = "./forged.json";
var forgingConfig = jsonfile.readFileSync(forgedFile);
const db = level('.db', {valueEncoding: 'json'});

const getTotalForged = function (node, pubKey, callback) {
    let url = 'http://' + node + ':6100/api/delegates/forging/getForgedByAccount?generatorPublicKey=' + pubKey;
    request({
        method: 'get',
        json: true, // Use,If you are sending JSON data
        url: url,
        headers: {
            "accept": "application/json"
        }
    }, function (err, res, body) {
        return callback(body);
    });
};

var doPayout = (options) => {
    util.log("==Payout Begin==");
    util.log("DateTime: " + moment().toISOString());
    let listVoters = [];

    getTotalForged(options.node, options.pubKey, function (totalForged) {
        smartholdemApi.getDelegate(options.delegate, (error, success, responseDelegate) => {
            let delegateParams = responseDelegate.delegate;
            smartholdemApi.getVoters(options.pubKey, (error, success, response) => {
                let delegateTotalForged = totalForged.forged / 100000000;

                forgingConfig.forged = delegateTotalForged;
                forgingConfig.lastDatePayments = Date.now();
                jsonfile.writeFile(forgedFile, forgingConfig);

                let forgingMilestone = delegateTotalForged - forgingConfig.forged;

                let total = (delegateParams.vote / 100000000);
                let distribution = forgingMilestone * options.percent / 100;

                for (let i = 0; i < response.accounts.length; i++) {
                    if (response.accounts[i].balance > options.minvote) {
                        let voterBalance = response.accounts[i].balance / 100000000;
                        let voterPercent = ((voterBalance / total) * 100).toFixed(2) * 1;
                        let reward = (distribution * voterPercent / 100).toFixed(2) * 1;
                        if (reward > 0.10 && response.accounts[i].address !== delegateParams.address) {
                            listVoters.push({
                                "address": response.accounts[i].address,
                                "balance": voterBalance.toFixed(0),
                                "percent": voterPercent,
                                "reward": reward
                            });
                        }
                    }
                }

                let txFee = 10000000; // 0.10
                for (let i = 0; i < listVoters.length; i++) {
                    let txOptions = {vendorField: 'Reward from ' + options.delegate};
                    let payout = new BigNumber(listVoters[i].reward).times(100000000);
                    payout = payout.minus(txFee);
                    let tx = smartholdemApi.createTransaction(options.pass, listVoters[i].address, payout.toNumber(), txOptions);
                    console.log(tx);

                    /*
                    db.put(username, 'STH', function (err) {
                        if (err) {
                            console.log('put', err);
                        }
                    });
                    */

                }


            });
        });
    });


};

exports.startScheduler = (cronJob, options) => {
    console.log(`Automatic payouts scheduled: ${cronJob}`);
    console.log('options', options);
    let paySchedule = scheduler.scheduleJob(cronJob, () => {
        doPayout(options);
    });
};
