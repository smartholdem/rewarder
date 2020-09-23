const express = require('express');
const router = express.Router();
const sth = require("sthjs");
const util = require("/modules/util");
const jsonFile = require('jsonfile');
const config = jsonFile.readFileSync("./config.json");
const level = require("level");
const db = level('/.db', {valueEncoding: 'json'});
const axios = require('axios');
const emitter = require('/emitter');

// 0x - Voters
// 1x - Stats
// 2x - Payouts

if (!config.secret) {
    util.log("Please enter the SmartHoldem Delegate passphrase");
    process.exit(1);
}

const PUB_KEY = sth.crypto.getKeys(config.secret).publicKey;

class Reward {
    async getDelegateVoters(pubKey) {

    }
}


module.exports = router;
