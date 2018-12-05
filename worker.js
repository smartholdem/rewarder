// reward worker
const request = require('request');
const util = require("./api/util");
const scheduler = require("node-schedule");
const jsonReader = require('jsonfile');
const rConfig = jsonReader.readFileSync("./config.json");

util.log("Worker started:" + 'http://127.0.0.1:' + rConfig.port);

//let workSchedule = scheduler.scheduleJob("*/10 * * * * *", () => {

function workerRequest(apiPath, callback) {

    request({
        method: 'post',
        json: true, // Use,If you are sending JSON data
        url: 'http://127.0.0.1:' + rConfig.port + apiPath,
        body: {},
        headers: {
            "accept": "application/json",
            "x-api-key": rConfig.appKey
        }
    }, function (err, res, body) {
        if (!err) {
            return callback(body);
        } else {
            return callback(false);
        }
    });

}

workerRequest('/api/worker/stats-update', function (dataStats) {
    workerRequest('/api/worker/voters-update', function (dataVoters) {
        console.log('dataStats', dataStats);
        // console.log('dataVoters',dataVoters);

        request({
            method: 'get',
            json: true, // Use,If you are sending JSON data
            url: 'http://127.0.0.1:' + rConfig.port + '/api/voters/getFromDb',
            body: {},
            headers: {
                "accept": "application/json"
            }
        }, function (err, res, body) {
            // console.log(body);
            let totalWeight = 0;
            let reward = dataStats.totalRewardAmount * (rConfig.rewardPercent / 100);

            for (let i=0; i < body.length; i++) {
                totalWeight = totalWeight + body[i].balance * 1;
            }

            let rewardsVoters = [];
            for (let i=0; i < body.length; i++) {
                let percent = (100 / totalWeight * body[i].balance).toFixed(8) * 1;
                rewardsVoters.push({
                    "address": body[i].address,
                    "personalPercent": percent,
                    "balance": body[i].balance / 10 ** 8,
                    "currentReward": Math.floor(reward * percent / 100) / 10 ** 8
                });
            }

            console.log(reward);
            console.log(rewardsVoters);

        });

    });
});

//});
