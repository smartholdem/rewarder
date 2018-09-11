var express = require('express');
var router = express.Router();
const nconf = require("nconf");
const smartholdemApi = require("sthjs-wrapper");
const sth = require("sthjs");


nconf.argv().file("../config.json");
const PASSPHRASE = nconf.get("secret");
if(!PASSPHRASE)
{
    console.log("Please enter the SmartHoldem Delegate passphrase");
    process.exit(1);
}

const PUBKEY = sth.crypto.getKeys(PASSPHRASE).publicKey;


/* GET users listing. */
router.get('/voters', function(req, res, next) {
    smartholdemApi.getVoters(PUBKEY, (error, success, response) => {
        res.json(response);
    });
});

router.get('/delegate/:name', function(req, res, next) {
        smartholdemApi.getDelegate(req.params["name"], (error, success, response) => {
            res.json(response);
        });
});



module.exports = router;
