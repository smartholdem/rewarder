var express = require('express');
var router = express.Router();
const jsonfile = require('jsonfile');
const fs = require('fs');
const nconf = require("nconf");
const smartholdemApi = require("sthjs-wrapper");
const sth = require("sthjs");
const request = require("request");

nconf.argv().file("./config.json");

const voterWeightMin = nconf.get("voterWeightMin") * 100000000;
const PASSPHRASE = nconf.get("secret");
const rewardPercent = nconf.get("rewardPercent");
const delegate = nconf.get("delegate");
const voterDaysMin = nconf.get("voterDaysMin");

var startedForging = jsonfile.readFileSync("./forged.json");
const PREFERRED_NODE = nconf.get("node");
if (!PASSPHRASE) {
    console.log("Please enter the SmartHoldem Delegate passphrase");
    process.exit(1);
}

const PUBKEY = sth.crypto.getKeys(PASSPHRASE).publicKey;


const getTotalForged = function (callback) {
    let url = 'http://' + PREFERRED_NODE + ':6100/api/delegates/forging/getForgedByAccount?generatorPublicKey=' + PUBKEY;
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


/* GET home page. */
router.get('/', function (req, res, next) {


    getTotalForged(function (totalForged) {
        smartholdemApi.getDelegate(delegate, (error, success, responseDelegate) => {
            let delegateParams = responseDelegate.delegate;
            smartholdemApi.getVoters(PUBKEY, (error, success, response) => {
                //  console.log('totalForged', totalForged);
                // console.log('delegateParams',delegateParams);
                let delegateTotalForged = totalForged.forged / 100000000;

                let nextReward = new Date(startedForging.lastDatePayments + (60 * 60 * 24 * 7 * 1000)).toLocaleString();

                if (startedForging.forged === 0) {
                    startedForging.forged = delegateTotalForged;
                    console.log('startedForging', startedForging);
                    jsonfile.writeFile("../forged.json", startedForging, function (err) {
                        if (err) console.error(err)
                    })
                }

                let forgingMilestone = delegateTotalForged - startedForging.forged;

                let total = (delegateParams.vote / 100000000);
                let distribution = forgingMilestone * rewardPercent / 100;

                let listVoters = [];

                for (let i = 0; i < response.accounts.length; i++) {
                    if (response.accounts[i].balance > voterWeightMin) {
                        let voterBalance = response.accounts[i].balance / 100000000;
                        let voterPercent = ((voterBalance / total) * 100).toFixed(2);
                        let reward = (distribution * voterPercent / 100).toFixed(2) * 1;
                        if (response.accounts[i].address !== delegateParams.address) {
                            listVoters.push({
                                "address": response.accounts[i].address,
                                "balance": voterBalance.toFixed(0),
                                "percent": voterPercent,
                                "reward": reward
                            });
                        }

                    }
                }

                res.render('index', {
                    title: 'List Voters',
                    voters: listVoters,
                    total: total.toFixed(0),
                    minvote: voterWeightMin / 100000000,
                    voterDaysMin: voterDaysMin,
                    rewardpercent: rewardPercent,
                    delegate: delegateParams,
                    forgingMilestone: forgingMilestone,
                    distribution: distribution,
                    totalForged: delegateTotalForged,
                    nextReward: nextReward

                });
            });
        });
    });


});

module.exports = router;
