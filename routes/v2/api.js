const express = require('express');
const router = express.Router();
const sth = require("sthjs");
const util = require("../../modules/util");
const jsonFile = require('jsonfile');
const config = jsonFile.readFileSync("./config.json");
const level = require("level");
const axios = require('axios');
const db = level('./.db', {valueEncoding: 'json'});
const emitter = require('../../emitter');
const crypto = require("crypto");
const cryptoRandomString = require('crypto-random-string');

// 0x - active Voters
// 1x - pending Voters
// 2x - Stats
// 3x - Payouts

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
            data = (await axios.get('http://' + config.node + ':6100/api/delegates/voters?publicKey=' + this.options.publicKey)).data.accounts
        } catch (e) {
            console.log('err:', e)
        }
        return data
    }

    async getDelegate() {
        let data = {}
        try {
            data = (await axios.get('http://' + config.node + ':6100/api/delegates/get?publicKey=' + this.options.publicKey)).data.delegate
        } catch (e) {
            console.log('err:', e)
        }

        data.rewardPercent = config.rewardPercent
        data.rewardPeriodDays = config.rewardPeriodDays
        data.voterWeightMin = config.voterWeightMin

        return data
    }

    async signMessage(message, passphrase) {
        let hash = crypto.createHash('sha256')
        hash = hash.update(Buffer.from(message, 'utf-8')).digest()
        const ecPair = sth.crypto.getKeys(passphrase)
        return ({signature: ecPair.sign(hash).toDER().toString('hex')}) // obj.signature
    }

    async verifyMessage(message, publicKey, signature) {
        // check for hexadecimal, otherwise the signature check would may fail
        const re = /[0-9A-Fa-f]{6}/g
        if (!re.test(publicKey) || !re.test(signature)) {
            // return here already because the process will fail otherwise
            return false
        }
        let hash = crypto.createHash('sha256')
        hash = hash.update(Buffer.from(message, 'utf-8')).digest()
        const ecPair = sth.ECPair.fromPublicKeyBuffer(Buffer.from(publicKey, 'hex'))
        const ecSignature = sth.ECSignature.fromDER(Buffer.from(signature, 'hex'))
        return (ecPair.verify(hash, ecSignature))
    }

    async sendGlobalStats() {
        const rndString = cryptoRandomString({length: 10});
        const sig = this.signMessage(rndString, this.secret)
        await axios.post('')
    }
}

const reward = new Reward({
    publicKey: PUB_KEY,
    secret: config.secret,
    globalStats: config.globalStats,
})

/** delegate voters array**/
router.get('/voters', async function (req, res, next) {
    res.json(await reward.getDelegateVoters());
});

/** get current delegate info **/
router.get('/delegate', async function (req, res, next) {
    res.json(await reward.getDelegate());
});



module.exports = router;
