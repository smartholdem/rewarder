var express = require('express');
var router = express.Router();
const request = require('request');
const smartholdemApi = require("sthjs-wrapper");
const sth = require("sthjs");
const util = require("../api/util");
const jsonReader = require('jsonfile');
const rConfig = jsonReader.readFileSync("./config.json");
const level = require("level");
const db = level('./.db', {valueEncoding: 'json'});

// 0x - Voters
// 1x - Stats
// 2x - Payouts

if (!rConfig.secret) {
    util.log("Please enter the SmartHoldem Delegate passphrase");
    process.exit(1);
}

const PUB_KEY = sth.crypto.getKeys(rConfig.secret).publicKey;

/* API FUNCTIONS */


// get db keys / values
const dbGetKey = (key) => {
    return new Promise((resolve, reject) => {
        db.get(key, function (err, data) {
            if (!err) {
                resolve(data);
            }
            reject(key);
        });
    });
};
var stats;

function statsUpdate(callback) {

    request({
        method: 'get',
        json: true, // Use,If you are sending JSON data
        url: 'http://' + rConfig.node + ':6100/api/delegates/forging/getForgedByAccount?generatorPublicKey=' + PUB_KEY,
        body: {},
        headers: {
            "accept": "application/json"
        }
    }, function (err, res, body) {

            if (!err) {
                dbGetKey('1xSTATS').then(function (stat) {
                    stat.totalRewardAmount = body.forged - stat.startedForgedAmount;
                    stat.currentForgedAmount = body.forged;
                    stat.timestampUpdate = Date.now();
                    db.put('1xSTATS', stat);
                    stats = stat;
                    return callback(stats);
                }, function (newStats) {
                    db.put('1xSTATS', {
                        "startedForgedAmount": body.forged,
                        "currentForgedAmount": body.forged,
                        "totalRewardAmount": 0,
                        "timestampUpdate": Date.now(),
                        "timestampFirstStart": Date.now(),
                    });
                });
            }
        });
    // return callback(stats);
}

db.on('put', function (key, value) {
   // console.log('inserted', {key, value})
});

// function for dynamic sorting
function compareValues(key, order = 'asc') {
    return function (a, b) {
        if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
            // property doesn't exist on either object
            return 0;
        }

        const varA = (typeof a[key] === 'string') ?
            a[key].toUpperCase() : a[key];
        const varB = (typeof b[key] === 'string') ?
            b[key].toUpperCase() : b[key];

        let comparison = 0;
        if (varA > varB) {
            comparison = 1;
        } else if (varA < varB) {
            comparison = -1;
        }
        return (
            (order == 'desc') ? (comparison * -1) : comparison
        );
    };
}

// get all voters current delegate from chain
function getVoters() {
    let activeVoters = [];
    return new Promise((resolve, reject) => {
        smartholdemApi.getVoters(PUB_KEY, (error, success, response) => {
            if (!error) {
                for (let i = 0; i < response.accounts.length; i++) {
                    activeVoters.push({
                        "address": response.accounts[i].address,
                        "balance": response.accounts[i].balance
                    });
                }
                resolve(activeVoters);
            }
            reject(false);
        });
    });
}

/* API ROUTES */

statsUpdate(function(data){
   console.log(data);
});

/* GET votes >= voterWeightMin */
router.get('/voters/getFromChain', function (req, res, next) {
    getVoters().then(function (data) {
        res.json(data);
    });
});

/* GET delegate info by name */
router.get('/delegate/:name', function (req, res, next) {
    smartholdemApi.getDelegate(req.params["name"], (error, success, response) => {
        res.json(response);
    });
});

/* Get Active Voters from LevelDb */
router.get('/voters/getFromDb', function (req, res, next) {
    let list = [];
    let totalAmount = 0;
    db.createReadStream({gte: '0x', lt: '1x', "limit": 500})
        .on('data', function (data) {
            list.push(data.value);
            totalAmount = totalAmount + data.value.balance * 1;
        })
        .on('end', function () {
            res.json(list.sort(compareValues('balance', 'desc')));
        });
});

/* Update worker votes db */
router.post('/worker/voters-update', function (req, res, next) {
    if (rConfig.appKey === req.headers['x-api-key']) {
        getVoters().then(function (data) {
            for (let i = 0; i < data.length; i++) {
                // console.log(data[i]);
                dbGetKey('0x' + data[i].address).then(function (dbVote) {
                    if (data[i].balance < (rConfig.voterWeightMin * 10 ** 8)) {
                        db.del('0x' + data[i].address);
                    } else {
                        dbVote.balance = data[i].balance;
                        db.put('0x' + data[i].address, dbVote);
                    }
                }, function (newVoter) {
                    if (data[i].balance >= (rConfig.voterWeightMin * 10 ** 8)) {
                        let addVoter = {
                            "address": data[i].address,
                            "balance": data[i].balance,
                            "reward": 0,
                            "timestamp": Date.now(),
                        };
                        db.put('0x' + data[i].address, addVoter);
                    }
                });
            }

        });
        res.json(true);
    } else {
        res.json(false);
    }
});


router.post('/worker/stats-update', function (req, res, next) {
    if (rConfig.appKey === req.headers['x-api-key']) {
        statsUpdate(function(data) {
            res.json(data);
        });
    }
});

// voter update reward
router.post('/worker/voter-reward', function (req, res, next) {
    if (rConfig.appKey === req.headers['x-api-key']) {
        res.json(true);
    }
});

router.post('/worker/update-reward', function (req, res, next) {
    if (rConfig.appKey === req.headers['x-api-key']) {
        db.get('0x' + req.body.address).then(function(data){
            console.log(req.body);
            data.personalPercent = req.body.personalPercent;
            data.reward = req.body.currentReward;
            db.put('0x' + req.body.address, data);
            res.json(data);
        });
    }
});

/* Get Active Voters from LevelDb */
router.get('/db/stats', function (req, res, next) {
    statsUpdate(function(data){
        dbGetKey('1xSTATS').then(function (data) {
            data.totalRewardAmount = data.totalRewardAmount / 10 ** 8;
            data.startedForgedAmount = data.startedForgedAmount / 10 ** 8;
            data.currentForgedAmount = data.currentForgedAmount / 10 ** 8;
            res.json(data);
        }, function (newStats) {
            res.json(false);
        });
    });

});

router.post('/db/add-record', function (req, res, next) {
    if (rConfig.appKey === req.headers['x-api-key']) {
        db.put(req.body.key, req.body.value).then(function(err, data){
            res.json(data);
        });
    }
});



module.exports = router;
