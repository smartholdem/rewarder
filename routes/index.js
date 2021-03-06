// front page
var express = require('express');
var router = express.Router();
const jsonReader = require('jsonfile');
const rConfig = jsonReader.readFileSync("./config.json");
const request = require("request");

/* GET home page. */
async function getStat() {
    return new Promise((resolve, reject) => {
        request({
            method: 'get',
            json: true, // Use,If you are sending JSON data
            url: 'http://localhost:' + rConfig.port + '/api/db/stats',
            headers: {
                "accept": "application/json"
            }
        }, function (err, res, body) {
            if (!err) {
                resolve(body);
            }
            reject(err);
        });
    });
}

async function getDelegate() {
    return new Promise((resolve, reject) => {
        request({
            method: 'get',
            json: true, // Use,If you are sending JSON data
            url: 'http://localhost:' + rConfig.port + '/api/delegate/' + rConfig.delegate,
            headers: {
                "accept": "application/json"
            }
        }, function (err, res, body) {
            if (!err) {
                resolve(body);
            }
            reject(err);
        });
    });
}

async function getVoters() {
    return new Promise((resolve, reject) => {
        request({
            method: 'get',
            json: true, // Use,If you are sending JSON data
            url: 'http://localhost:' + rConfig.port + '/api/voters/getFromDb',
            headers: {
                "accept": "application/json"
            }
        }, function (err, res, body) {
            if (!err) {
                resolve(body);
            }
            reject(err);
        });
    });
}

router.get('/', function (req, res, next) {
    if (rConfig.personalPage) {
        getStat().then(function (dataStat) {
            getVoters().then(function (dataVoters) {
                getDelegate().then(function (dataDelegate) {
                    if (dataVoters.length > 0) {
                        for (let i = 0; i < dataVoters.length; i++) {
                            dataVoters[i].balance = dataVoters[i].balance / 100000000;
                            dataVoters[i].reward = dataVoters[i].reward / 100000000;
                        }
                    }

                    let remainingHours = (Math.floor(Date.now() / 1000) - ((Math.floor(dataStat.timestampUpdate / 1000) + (rConfig.rewardPeriodDays * 60 * 60 * 24))) / 60 / 60);

                    res.render('index', {
                        title: 'Delegate ' + rConfig.delegate,
                        stats: dataStat,
                        voterDaysMin: rConfig.voterDaysMin,
                        rewardPercent: rConfig.rewardPercent,
                        delegate: rConfig.delegate,
                        delegateInfo: dataDelegate.delegate,
                        totalPayout: 0,
                        voters: dataVoters,
                        totalVoters: dataVoters.length,
                        timeRemaining: remainingHours
                    });
                });
            });
        });
    } else {
        res.json('Personal Delegate page disabled');
    }
});

module.exports = router;
