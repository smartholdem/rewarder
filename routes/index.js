var express = require('express');
var router = express.Router();

const nconf = require("nconf");
const smartholdemApi = require("sthjs-wrapper");
const sth = require("sthjs");


nconf.argv().file("../config.json");

const voterWeightMin = nconf.get("voterWeightMin") * 100000000;
const PASSPHRASE = nconf.get("secret");
const rewardPercent = nconf.get("rewardPercent");
const delegate = nconf.get("delegate");
const voterDaysMin = nconf.get("voterDaysMin");
const forgingMilestone = 10000;
if (!PASSPHRASE) {
    console.log("Please enter the SmartHoldem Delegate passphrase");
    process.exit(1);
}


const PUBKEY = sth.crypto.getKeys(PASSPHRASE).publicKey;

/* GET home page. */
router.get('/', function (req, res, next) {


    smartholdemApi.getDelegate(delegate, (error, success, responseDelegate) => {
        let delegateParams = responseDelegate.delegate;
        smartholdemApi.getVoters(PUBKEY, (error, success, response) => {
            console.log(delegateParams);

            let total = (delegateParams.vote / 100000000);
            let distribution = forgingMilestone * rewardPercent / 100;


            let listVoters = [];

            for (let i = 0; i < response.accounts.length; i++) {
                if (response.accounts[i].balance > voterWeightMin) {
                    let voterBalance = response.accounts[i].balance / 100000000;
                    let voterPercent = ((voterBalance / total) * 100).toFixed(2);
                    listVoters.push({
                        "address": response.accounts[i].address,
                        "balance": voterBalance.toFixed(0),
                        "percent": voterPercent,
                        "reward": (distribution * voterPercent / 100).toFixed(2)
                    });
                }
            }

            res.render('index', {
                title: 'List Voters',
                voters: listVoters,
                total: total.toFixed(0),
                minvote: voterWeightMin / 100000000,
                voterDaysMin: voterDaysMin,
                rewardpercent: rewardPercent,
                delegate: delegateParams,
                forgingMilestone: forgingMilestone,
                distribution: distribution

            });
        });
    });


});

module.exports = router;
