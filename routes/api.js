var express = require('express');
var router = express.Router();
const smartholdemApi = require("sthjs-wrapper");
const sth = require("sthjs");
const jsonReader = require('jsonfile');
const util = require("../api/util");
const rConfig = jsonReader.readFileSync("./config.json");
const level = require("level");
const db = level('.db', {valueEncoding: 'json'});

if(!rConfig.secret)
{
    util.log("Please enter the SmartHoldem Delegate passphrase");
    process.exit(1);
}

const PUB_KEY = sth.crypto.getKeys(rConfig.secret).publicKey;

/* GET votes >= voterWeightMin */
router.get('/voters', function(req, res, next) {
    let activeVoters = [];
    let totalVote = 0;
    smartholdemApi.getVoters(PUB_KEY, (error, success, response) => {
        for (let i=0; i < response.accounts.length; i++) {
            if (response.accounts[i].balance / (10 ** 8) >= rConfig.voterWeightMin) {
                totalVote = totalVote + response.accounts[i].balance / (10 ** 8);
                activeVoters.push(response.accounts[i]);
            }
        }
        res.json({voters: activeVoters, total: totalVote});
    });
});

/* GET delegate info by name */
router.get('/delegate/:name', function(req, res, next) {
        smartholdemApi.getDelegate(req.params["name"], (error, success, response) => {
            res.json(response);
        });
});

module.exports = router;
