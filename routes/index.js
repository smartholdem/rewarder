// front page
var express = require('express');
var router = express.Router();
const jsonReader = require('jsonfile');
const rConfig = jsonReader.readFileSync("./config.json");
const smartholdemApi = require("sthjs-wrapper");
const sth = require("sthjs");
const request = require("request");

if (!rConfig.secret) {
    console.log("Please enter the SmartHoldem Delegate passphrase");
    process.exit(1);
}

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {
        title: 'Delegate Rewarder',
        voterDaysMin: rConfig.voterDaysMin,
        rewardPercent: rConfig.rewardPercent,
        delegate: rConfig.delegate,
        totalPayout: 0,
    });
});

module.exports = router;
