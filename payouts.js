const smartholdemApi = require("sthjs-wrapper");
const moment = require("moment");
const BigNumber = require("bignumber.js");
const scheduler = require("node-schedule");
const util = require("./api/util");
const request = require("request");
const jsonReader = require('jsonfile');
const rConfig = jsonReader.readFileSync("./config.json");

const sth = require("sthjs");
const PUB_KEY = sth.crypto.getKeys(rConfig.secret).publicKey;
const DELEGATE_ADDRESS = sth.crypto.getAddress(PUB_KEY);

function dbUpdate(key, value) {
    request({
        method: 'post',
        json: true, // Use,If you are sending JSON data
        url: 'http://127.0.0.1:' + rConfig.port + '/api/db/add',
        body: {"key": key, "value": value},
        headers: {
            "accept": "application/json",
            "x-api-key": rConfig.appKey
        }
    }, function (err, res, body) {
        if (!err) {
            console.log(body);
        }
    });
}


var doPayout = () => {
        util.log("==Payout Begin==");
        util.log("DateTime: " + moment().toISOString());
        let transactions = [];

        request({
            method: 'get',
            json: true, // Use,If you are sending JSON data
            url: 'http://127.0.0.1:' + rConfig.port + '/api/voters/getFromDb',
            headers: {
                "accept": "application/json"
            }
        }, function (err, res, body) {
            if (!err) {
                let fee = 10000000;
                let totalPayout = 0;
                for (let i = 0; i < body.length; i++) {
                    let payoutSum = body[i].reward - fee;
                    if (payoutSum > 10000000) {
                        totalPayout = totalPayout + body[i].reward;

                        // create tx if not current delegate address
                        if (body[i].address !== DELEGATE_ADDRESS) {
                            transactions.push(smartholdemApi.createTransaction(rConfig.secret, body[i].address, payoutSum, {vendorField: "Reward from " + rConfig.delegate}));
                        }

                        dbUpdate('0x' + body[i].address, {
                            "address": body[i].address,
                            "balance": body[i].balance,
                            "reward": 0,
                            "timestamp": body[i].timestamp,
                            "personalPercent": body[i].personalPercent
                        });
                    }
                }


                if (transactions) {
                    smartholdemApi.sendTransactions(transactions, (error, success, responseSend) => {
                        if (!error) {
                            if (responseSend.success === true) {
                                util.log("Total Payout:" + (totalPayout / 100000000));
                                for (let i = 0; i < transactions.length; i++) {
                                    dbUpdate('2x' + transactions[i].id, {
                                        "recipientId": transactions[i].recipientId,
                                        "amount": transactions[i].amount,
                                        "timestamp": Date.now()
                                    });
                                }

                                request({
                                    method: 'post',
                                    json: true, // Use,If you are sending JSON data
                                    url: 'http://127.0.0.1:' + rConfig.port + '/api/stats/cleanup',
                                    body: {"totalPayout": totalPayout},
                                    headers: {
                                        "accept": "application/json",
                                        "x-api-key": rConfig.appKey
                                    }
                                });
                            }
                        }
                    });
                }
            }
        });
    };

exports.startScheduler = (cronJob, options) => {
    console.log(`Automatic payouts scheduled: ${cronJob}`);
    let paySchedule = scheduler.scheduleJob(cronJob, () => {
        util.log("Payout on DateTime: " + moment().toISOString());
        doPayout(options);
    });
};
