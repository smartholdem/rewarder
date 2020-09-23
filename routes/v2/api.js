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

    constructor(data) {
        this.options = data
    }

    async getDelegateVoters() {
        let data = []
        try {
            data = (await axios.get('http://' + config.node + ':6100/api/delegates/voters?publicKey=' + this.options.publicKey)).data
        } catch(e) {
            console.log('err:', e)
        }
        return data
    }
}

const reward = new Reward({
    publicKey: PUB_KEY
})

router.get('/voters', async function (req, res, next) {
   res.json(await reward.getDelegateVoters());
});


module.exports = router;
