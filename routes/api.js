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
                    if (response.accounts[i].balance / (10 ** 8) >= rConfig.voterWeightMin) {

                        dbGetKey('0x' + response.accounts[i].address).then(function (data) {

                        }, function (newVoter) {

                        });

                        activeVoters.push(response.accounts[i]);
                    }
                }
                resolve(activeVoters);
            }
            reject(false);
        });
    });

}

/* API ROUTES */

/* GET votes >= voterWeightMin */
router.get('/voters', function (req, res, next) {
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

module.exports = router;
