// reward worker
const request = require('request');
const util = require("./api/util");
const scheduler = require("node-schedule");
const jsonReader = require('jsonfile');
const rConfig = jsonReader.readFileSync("./config.json");

util.log("Worker started:" + 'http://127.0.0.1:' + rConfig.port);

// recalculations cron
let workSchedule = scheduler.scheduleJob("1 */30 * * * *", () => {

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

            for (let i = 0; i < body.length; i++) {
                totalWeight = totalWeight + body[i].balance * 1;
            }

            let rewardsVoters = [];
            let totalRewards = 0;
            for (let i = 0; i < body.length; i++) {
                let percent = (100 / totalWeight * body[i].balance).toFixed(4) * 1;
                let currentReward = Math.floor(reward * percent / 100); // / 10 ** 8;
                totalRewards = totalRewards + currentReward;
                rewardsVoters.push({
                    "address": body[i].address,
                    "personalPercent": percent,
                    "currentReward": currentReward
                });
            }


            console.log(rewardsVoters);
            console.log('reward div', reward / 10 ** 8);
            console.log('totalRewards', totalRewards / 10 ** 8);

            for (let i = 0; i < rewardsVoters.length; i++) {
                request({
                    method: 'post',
                    json: true, // Use,If you are sending JSON data
                    url: 'http://127.0.0.1:' + rConfig.port + '/api/worker/update-reward',
                    body: rewardsVoters[i],
                    headers: {
                        "accept": "application/json",
                        "x-api-key": rConfig.appKey
                    }
                }, function (errUpdate, resUdate, bodyUpdate) {
                    if (!errUpdate) {
                        bodyUpdate.reward = bodyUpdate.reward / 10 ** 8;
                        bodyUpdate.balance = bodyUpdate.balance / 10 ** 8;
                        console.log(bodyUpdate);
                    }
                });
            }

        });

    });
});

});
