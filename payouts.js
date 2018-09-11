const fs = require("fs");
const scheduler = require("node-schedule");
const util = require("./api/util");



exports.startScheduler = (threshold, cronJob, passphrase, secondPassphrase = null) => {
    console.log(`Automatic payouts scheduled: ${cronJob}`);




    var paySchedule = scheduler.scheduleJob(cronJob, () => {

    });
};
