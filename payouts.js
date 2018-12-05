const smartholdemApi = require("sthjs-wrapper");
const moment = require("moment");
const BigNumber = require("bignumber.js");
const scheduler = require("node-schedule");
const util = require("./api/util");
const request = require("request");
const jsonReader = require('jsonfile');
const rConfig = jsonReader.readFileSync("./config.json");

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
            for (let i=0; i < body.length; i++) {
                let payoutSum = body[i].reward - fee;
                if (payoutSum > 10000000) {
                    transactions.push(smartholdemApi.createTransaction(rConfig.secret, body[i].address, payoutSum, {vendorField: "Payout from " + rConfig.delegate}));
                }
            }

            console.log(transactions);
            /*
            smartholdemApi.sendTransactions(transactions, (error, success, responseSend) => {
                if (!error) {
                    if (responseSend.success === true) {
                        for (let i=0; i < transactions.length; i++) {

                        }
                    }
                }
            });
*/
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
