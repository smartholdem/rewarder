var express = require('express');
var router = express.Router();
const smartholdemApi = require("sthjs-wrapper");
const sth = require("sthjs");
const util = require("../api/util");
const jsonReader = require('jsonfile');
const rConfig = jsonReader.readFileSync("./config.json");
const level = require("level");
const db = level('./.db', {valueEncoding: 'json'});

// 0x - Voters

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

if (!rConfig.secret) {
    util.log("Please enter the SmartHoldem Delegate passphrase");
    process.exit(1);
}

const PUB_KEY = sth.crypto.getKeys(rConfig.secret).publicKey;

/* API FUNCTIONS */

function getVoters() {
    let activeVoters = [];
    return new Promise((resolve, reject) => {
        smartholdemApi.getVoters(PUB_KEY, (error, success, response) => {
            if (!error) {
                for (let i = 0; i < response.accounts.length; i++) {
                    //if (response.accounts[i].balance / (10 ** 8) >= rConfig.voterWeightMin) {
                    activeVoters.push({"address":response.accounts[i].address, "balance": response.accounts[i].balance});
                    //}
                }
                resolve(activeVoters);
            }
            reject(false);
        });
    });
}

/* API ROUTES */

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


router.get('/voters/getFromDb', function (req, res, next) {
    let list = [];
    db.createReadStream({gte: '0x', lt: '1x', "limit": 500})
        .on('data', function (data) {
            list.push(data.value);
        })
        .on('end', function () {
            res.json(list.sort(compareValues('balance', 'desc')));
        });
});

/* Update votes db */
router.post('/voters/update', function (req, res, next) {
    if (rConfig.appKey === req.headers['x-api-key']) {
        getVoters().then(function (data) {
            for (let i=0; i < data.length; i++) {
                console.log(data[i]);
                dbGetKey('0x' + data[i].address).then(function (dbVote) {
                    if (data[i].balance < (rConfig.voterWeightMin * 10 ** 8)) {
                        db.del('0x' + data[i].address);
                    } else {
                        dbVote.balance = data[i].balance;
                        dbVote.reward = 0;
                        db.put('0x' + data[i].address, dbVote);
                    }
                }, function (newVoter) {
                    if (data[i].balance >= (rConfig.voterWeightMin * 10 ** 8)) {
                        db.put('0x' + data[i].address, {
                            "address": data[i].address,
                            "balance": data[i].balance,
                            "reward": 0,
                            "timestamp": Date.now(),
                        }).then(function (value) {
                            console.log(value)
                        });
                    }
                });
            }
        });


        res.json(true);
    } else {
        res.json(false);
    }
});


module.exports = router;
