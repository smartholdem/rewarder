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
const schedule = require('node-schedule')
const DbUtils = require('../../modules/dbUtils')
const dbUtils = new DbUtils()
let daysLeft = -1

try {
    daysLeft = jsonFile.readFileSync("./daysLeft.json").days;
} catch (e) {
    daysLeft = config.day
    jsonFile.writeFileSync("./daysLeft.json", {days: daysLeft})
}

console.log('daysLeft', daysLeft)


// 0x - pending Voters
// 1x - active Voters
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

        data.percent = config.percent
        data.day = config.day
        data.minVote = config.minVote

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
        const sig = await this.signMessage(rndString, this.options.secret)
        let data = await axios.post(this.options.globalStatsAPI, {
            sig: sig.signature,
            rndString: rndString,
            delegate: await this.getDelegate(),
        })
        return data.data
    }

    async getNetworkFees() {
        let fees = {}
        try {
            fees = (await axios.get('http://' + config.node + ':6100/api/blocks/getFees')).data.fees
        } catch (e) {
            console.log('err:', e)
        }
        return fees
    }

    async updateVoters() {
        let dt = Math.floor(Date.now() / 1000) - 60 * 60 * 24 * this.options.daysPending;
        let voters = await reward.getDelegateVoters()
        let pendingVoters = await dbUtils.dbObj(db, '0', '1')
        let activeVoters = await dbUtils.dbObj(db, '1', '2')
        let activeVotersArray = await dbUtils.dbArray(db, '1', '2')

        for (let i = 0; i < voters.length; i++) {
            if (pendingVoters[voters[i].address]) {
                if (dt > pendingVoters[voters[i].address].timestamp) {
                    /** set to active voter **/
                    await db.put('1x' + voters[i].address, {
                        username: voters[i].username,
                        address: voters[i].address,
                        publicKey: voters[i].publicKey,
                        balance: voters[i].balance,
                        timestamp: Math.floor(Date.now() / 1000),
                        percent: 0,
                        waitPay: 0,
                        totalPay: 0,
                    });
                    await db.del('0x' + voters[i].address); // remove voter from pending
                }
            }

            /** Update real balance Active voters **/
            if (activeVoters[voters[i].address]) {
                await db.put('1x' + voters[i].address, {
                    username: voters[i].username,
                    address: voters[i].address,
                    publicKey: voters[i].publicKey,
                    balance: voters[i].balance,
                    timestamp: activeVoters[voters[i].address].timestamp,
                    percent: activeVoters[voters[i].address].percent,
                    waitPay: activeVoters[voters[i].address].waitPay,
                    totalPay: activeVoters[voters[i].address].totalPay,
                });
            }

            /** Remove from active if unvote **/
            let removeVote = true
            for (let j = 0; j < activeVotersArray.length; j++) {
                if (activeVotersArray[j].address === voters[i].address) {
                    removeVote = false;
                    break;
                }
            }
            if (removeVote) {
                await db.del('1x' + voters[i].address);
            }


        }


    }

    async runPayments() {

    }

}

const reward = new Reward({
    publicKey: PUB_KEY,
    secret: config.secret,
    globalStatsAPI: config.globalStatsAPI,
    daysPending: config.daysPending,
})


/** CRON Payments **/
const rule = new schedule.RecurrenceRule();
rule.hour = config.hour; //default 23 (0 - 23)
const cronPayment = schedule.scheduleJob(rule, async function () {
    daysLeft--;
    console.log('daysLeft', daysLeft)
    if (daysLeft < 1) {
        daysLeft = config.day;
        await reward.updateVoters();
        await reward.runPayments();
    }
    jsonFile.writeFileSync("./daysLeft.json", {days: daysLeft})
});

/** CRON Voters **/
const ruleVoters = new schedule.RecurrenceRule();
ruleVoters.minute = 31; //default 30 (0 - 59)
const cronVoters = schedule.scheduleJob(ruleVoters, async function () {
    let voters = await reward.getDelegateVoters()
    let pendingVoters = await dbUtils.dbObj(db, '0', '1')
    let activeVoters = await dbUtils.dbObj(db, '1', '2')
    for (let i = 0; i < voters.length; i++) {
        if (!activeVoters[voters[i].address]) {
            if (!pendingVoters[voters[i].address]) {
                await db.put('0x' + voters[i].address, {
                    username: voters[i].username,
                    address: voters[i].address,
                    publicKey: voters[i].publicKey,
                    balance: voters[i].balance,
                    timestamp: Math.floor(Date.now() / 1000),
                });
                console.log('voters', voters);
            }
        }
    }

    await reward.updateVoters()

});


/** delegate voters array**/
router.get('/voters', async function (req, res, next) {
    res.json(await reward.getDelegateVoters());
});

/** get current delegate info **/
router.get('/delegate', async function (req, res, next) {
    res.json(await reward.getDelegate());
});

/** get network fees **/
router.get('/fees', async function (req, res, next) {
    res.json(await reward.getNetworkFees());
});

/** sig global stats manually **/
router.get('/sig', async function (req, res, next) {
    res.json(await reward.sendGlobalStats());
});

/** read objs by keys **/
router.get('/db/:from/:to', async function (req, res, next) {
    res.json(await dbUtils.dbObj(db, req.params["from"], req.params["to"]));
});

module.exports = router;
