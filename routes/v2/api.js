const express = require('express');
const router = express.Router();
const sth = require("sthjs");
const util = require("../../modules/util");
const jsonFile = require('jsonfile');
let config = jsonFile.readFileSync("./config.json");
const level = require("level");
const axios = require('axios');
const db = level('./.db', {valueEncoding: 'json'});
const emitter = require('../../emitter');
const crypto = require("crypto");
const cryptoRandomString = require('crypto-random-string');
const schedule = require('node-schedule');
const DbUtils = require('../../modules/dbUtils');
const dbUtils = new DbUtils();
let daysLeft = -1;

try {
    daysLeft = jsonFile.readFileSync("./daysLeft.json").days;
} catch (e) {
    daysLeft = config.day;
    jsonFile.writeFileSync("./daysLeft.json", {days: daysLeft})
}

console.log('daysLeft', daysLeft);


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
        let data = [];
        try {
            data = (await axios.get('http://' + config.node + ':6100/api/delegates/voters?publicKey=' + this.options.publicKey)).data.accounts
        } catch (e) {
            console.log('err:', e)
        }
        return data
    }

    async getForged() {
        let data = {};
        try {
            data = (await axios.get('http://' + config.node + ':6100/api/delegates/forging/getForgedByAccount?generatorPublicKey=' + this.options.publicKey)).data
        } catch (e) {
            console.log('err:', e)
        }
        return data
    }

    async getDelegate() {
        let data = {};
        try {
            data = (await axios.get('http://' + config.node + ':6100/api/delegates/get?publicKey=' + this.options.publicKey)).data.delegate
        } catch (e) {
            console.log('err:', e)
        }

        data.vote = parseInt((data.vote / 10 ** 8).toFixed(0))
        data.percent = config.percent;
        data.day = config.day;
        data.minVote = config.minVote;
        data.daysLeft = daysLeft;
        data.port = config.port;
        data.totalForged = (await this.getForged()).forged / 10 ** 8;

        return data
    }

    async signMessage(message, passphrase) {
        let hash = crypto.createHash('sha256');
        hash = hash.update(Buffer.from(message, 'utf-8')).digest();
        const ecPair = sth.crypto.getKeys(passphrase);
        return ({signature: ecPair.sign(hash).toDER().toString('hex')}) // obj.signature
    }

    async verifyMessage(message, publicKey, signature) {
        // check for hexadecimal, otherwise the signature check would may fail
        const re = /[0-9A-Fa-f]{6}/g;
        if (!re.test(publicKey) || !re.test(signature)) {
            // return here already because the process will fail otherwise
            return false
        }
        let hash = crypto.createHash('sha256');
        hash = hash.update(Buffer.from(message, 'utf-8')).digest();
        const ecPair = sth.ECPair.fromPublicKeyBuffer(Buffer.from(publicKey, 'hex'));
        const ecSignature = sth.ECSignature.fromDER(Buffer.from(signature, 'hex'));
        return (ecPair.verify(hash, ecSignature))
    }

    /** sign & send delegate stats on server statistics **/
    async sendGlobalStats() {
        let data = {
            sig: null,
            rndString: null,
            delegate: {},
        };

        const rndString = cryptoRandomString({length: 10});
        try {
            const sig = await this.signMessage(rndString, this.options.secret);
            data = await axios.post(this.options.globalStatsAPI, {
                sig: sig.signature,
                rndString: rndString,
                delegate: await this.getDelegate(),
            })
        } catch (e) {

        }
        return data.data
    }

    async getNetworkFees() {
        let fees = {};
        try {
            fees = (await axios.get('http://' + config.node + ':6100/api/blocks/getFees')).data.fees
        } catch (e) {
            console.log('err:', e)
        }
        return fees
    }

    async updateVoters() {
        //console.log('updateVoters')
        let dt = Math.floor(Date.now() / 1000) - 60 * 60 * 24 * this.options.daysPending;
        if (config.dev) {
            dt = Math.floor(Date.now() / 1000) - 60 * 5; // 5 min on dev pending
        }

        let voters = await reward.getDelegateVoters();
        let pendingVoters = await dbUtils.dbObj(db, '0', '1'); //as objects
        let activeVoters = await dbUtils.dbObj(db, '1', '2'); //as objects
        let activeVotersArray = await dbUtils.dbArray(db, '1', '2'); // as array

        for (let i = 0; i < voters.length; i++) {
            let keyPVoter = '0x' + voters[i].address;
            if (pendingVoters[keyPVoter]) {
                if (dt > pendingVoters[keyPVoter].timestamp) {
                    /** set to active voter **/
                    let active = {
                        username: voters[i].username,
                        address: voters[i].address,
                        publicKey: voters[i].publicKey,
                        balance: parseInt((voters[i].balance / 10 ** 8).toFixed(0)),
                        timestamp: Math.floor(Date.now() / 1000),
                        percent: 0,
                        waitPay: 0,
                        totalPay: 0,
                    };
                    await db.put('1x' + voters[i].address, active);
                    console.log('set active', voters[i].address);
                    await db.del('0x' + voters[i].address); // remove voter from pending
                    activeVotersArray.push(active)
                }
            }

            /** Update real balance Active voters **/
            let keyAVoter = '1x' + voters[i].address;
            if (activeVoters[keyAVoter]) {
                let activeVoter = {
                    username: voters[i].username,
                    address: voters[i].address,
                    publicKey: voters[i].publicKey,
                    balance: parseInt((voters[i].balance / 10 ** 8).toFixed(0)),
                    timestamp: activeVoters[keyAVoter].timestamp,
                    percent: activeVoters[keyAVoter].percent,
                    waitPay: activeVoters[keyAVoter].waitPay,
                    totalPay: activeVoters[keyAVoter].totalPay,
                };

                await db.put('1x' + voters[i].address, activeVoter);
            }

            /** Remove from active if unvote **/

            let removeVote = true;
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


    async prepareTx(options) {
        let vendorField = options.memo ? options.memo : null;
        let secondPassphrase = null;
        let version = 0x3f;
        let fee = 100000000;
        return sth.transaction.createTransaction(options.recipient, (options.amount * Math.pow(10, 8)).toPrecision(20).split('.')[0] * 1, vendorField, options.secret, secondPassphrase, version, fee)
    }

    async broadcastTxs(txs = []) {
        let result = {
            success: false,
            transactionIds: [],
        }
        try {
            const data = await axios.post('http://' + config.node + ':6100' + '/peer/transactions', {transactions: txs}, {
                    headers: {
                        "Content-Type": "application/json",
                        "os": "sth-client",
                        "version": "0.6.0",
                        "nethash": 'fc46bfaf9379121dd6b09f5014595c7b7bd52a0a6d57c5aff790b42a73c76da7',
                        "port": 6100
                    },
                }
            )
            result = data.data
        } catch (e) {

        }
        return result
    }

    async calcPercents() {
        let delegate = await dbUtils.dbGet(db, 'DELEGATE');
        let voters = await dbUtils.dbArray(db, '1', '2');
        for (let i=0; i < voters.length; i++) {
            voters[i].percent = (100 / delegate.vote * voters[i].balance).toFixed(2) * 1;
            voters[i].waitPay = (voters[i].percent / 100 * delegate.roundForged).toFixed(3) * 1;
            await db.put('1x' + voters[i].address, voters[i])
        }
    }

    async runPayments() {
        let delegate = await dbUtils.dbGet(db, 'DELEGATE');
        let voters = await dbUtils.dbArray(db, '1', '2');
        if (delegate.roundForged > voters.length * 2) {
            let preparedTxs = []
            for (let i=0; i < voters.length; i++) {

            }
        }
    }

    async cronVoters() {
        let voters = await this.getDelegateVoters();
        let pendingVoters = await dbUtils.dbObj(db, '0', '1');
        let activeVoters = await dbUtils.dbObj(db, '1', '2');
        for (let i = 0; i < voters.length; i++) {
            if (!activeVoters['1x' + voters[i].address] && !pendingVoters['0x' + voters[i].address]) {
                await db.put('0x' + voters[i].address, {
                    username: voters[i].username,
                    address: voters[i].address,
                    publicKey: voters[i].publicKey,
                    balance: parseInt((voters[i].balance / 10 ** 8).toFixed(0)),
                    timestamp: Math.floor(Date.now() / 1000),
                });
                console.log('new pending voter', voters[i]);
            }
        }
    }

    async statsDelegate() {
        let Delegate = await this.getDelegate();
        let statsDelegate = await dbUtils.dbGet(db, 'DELEGATE');
        if (!statsDelegate) {
            Delegate.startForged = Delegate.totalForged;
            Delegate.roundForged = 0;
            Delegate.totalPayout = 0;
            await db.put('DELEGATE', Delegate);
        } else {
            statsDelegate.totalForged = Delegate.totalForged;
            statsDelegate.roundForged = (Delegate.totalForged - statsDelegate.startForged).toFixed(2) * 1;
            await db.put('DELEGATE', statsDelegate);
        }
    }

    async init() {
        await this.cronVoters();
        await this.updateVoters();
        await this.statsDelegate();
        await this.calcPercents();
    }

}

const reward = new Reward({
    publicKey: PUB_KEY,
    secret: config.secret,
    globalStatsAPI: config.globalStatsAPI,
    daysPending: config.daysPending,
});


reward.init().then(function () {
    console.log('init');
});

/** CRON Payments (sec=1 min=1 hour=1 day=*) **/
/** run every day & dec daysLeft **/
schedule.scheduleJob("1 1 1 * * *", async () => {
    daysLeft--;
    console.log('daysLeft', daysLeft);
    if (daysLeft < 1) {
        console.log('run payments');
        daysLeft = config.day;
        await reward.updateVoters();
        await reward.runPayments();
    }
    jsonFile.writeFileSync("./daysLeft.json", {days: daysLeft});
});

/** CRON Voters every 20 minutes **/
schedule.scheduleJob("1 */20 * * * *", async () => {
    await reward.cronVoters();
    await reward.updateVoters();
});


/** CRON Delegate every 9 minutes **/
schedule.scheduleJob("1 */9 * * * *", async () => {
    await reward.statsDelegate();
    await reward.calcPercents();
});


/** delegate voters array**/
router.get('/voters/current', async function (req, res, next) {
    res.json(await reward.getDelegateVoters());
});

/** get current delegate info **/
router.get('/delegate', async function (req, res, next) {
    //res.json(await reward.getDelegate());
    res.json(await dbUtils.dbGet(db, 'DELEGATE'));
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

router.get('/dbkey/:key', async function (req, res, next) {
    res.json(await dbUtils.dbGet(db, req.params["key"]));
});


/** pending voters list **/
router.get('/voters/pending', async function (req, res, next) {
    res.json(await dbUtils.dbObj(db, '0', '1'));
});

/** active voters list **/
router.get('/voters/active', async function (req, res, next) {
    res.json(await dbUtils.dbObj(db, '1', '2'));
});

module.exports = router;
