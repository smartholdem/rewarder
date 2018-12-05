const smartholdemApi = require("sthjs-wrapper");
const moment = require("moment");
const BigNumber = require("bignumber.js");
const scheduler = require("node-schedule");
const util = require("./api/util");
const request = require("request");
const jsonfile = require('jsonfile');
const forgedFile = "./forged.json";

var doPayout = (options) => {
    util.log("==Payout Begin==");
    util.log("DateTime: " + moment().toISOString());
    let listVoters = [];



};

exports.startScheduler = (cronJob, options) => {
    console.log(`Automatic payouts scheduled: ${cronJob}`);
    console.log('options', options);
    let paySchedule = scheduler.scheduleJob(cronJob, () => {
        doPayout(options);
    });
};
