// front page
var express = require('express');
var router = express.Router();
const jsonReader = require('jsonfile');
const rConfig = jsonReader.readFileSync("./config.json");
const smartholdemApi = require("sthjs-wrapper");
const sth = require("sthjs");
const request = require("request");

const voterWeightMin = nconf.get("voterWeightMin") * 100000000;
const PASSPHRASE = nconf.get("secret");
const rewardPercent = nconf.get("rewardPercent");
const voterDaysMin = nconf.get("voterDaysMin");

if (!PASSPHRASE) {
    console.log("Please enter the SmartHoldem Delegate passphrase");
    process.exit(1);
}

const PUBKEY = sth.crypto.getKeys(PASSPHRASE).publicKey;

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {
        title: 'List Voters',
        voters: listVoters,
        total: total.toFixed(0),
        minvote: voterWeightMin / 100000000,
        voterDaysMin: voterDaysMin,
        rewardpercent: rewardPercent,
        delegate: delegateParams,
        forgingMilestone: forgingMilestone,
        distribution: distribution,
        totalForged: delegateTotalForged,
        nextReward: nextReward
    });
});

module.exports = router;
