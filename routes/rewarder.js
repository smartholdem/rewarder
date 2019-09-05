/**
 * Rewarder v2
 * @type {*|createApplication}
 */

const express = require('express')
const router = express.Router()
const axios = require('axios')
const smartholdemApi = require("sthjs-wrapper")
const sth = require("sthjs")
const util = require("../api/util")
const jsonReader = require('jsonfile')
const rConfig = jsonReader.readFileSync("./config.json")
const level = require("level")
const db = level('./.rewarder', {valueEncoding: 'json'})

// 0x - Voters
// 1x - Stats
// 2x - Payouts

if (!rConfig.secret) {
    util.log("Please enter the SmartHoldem Delegate passphrase");
    process.exit(1);
}

const PUB_KEY = sth.crypto.getKeys(rConfig.secret).publicKey;

class Rewarder {

    async statsUpdate(PubKey) {
        const uri = 'http://' + rConfig.node + ':6100/api/delegates/forging/getForgedByAccount?generatorPublicKey=' + PubKey
        let stats = {}
        const forgingData = (await axios.get(uri)).data
        if (result) {
            try {
                stats = await db.get('1xSTATS')
                stats.totalRewardAmount = forgingData.forged - stats.startedForgedAmount
                stats.currentForgedAmount = forgingData.forged
                stats.timestampUpdate = Date.now()
            } catch(e) {
                stats = {
                    "startedForgedAmount": forgingData.forged,
                    "currentForgedAmount": forgingData.forged,
                    "totalRewardAmount": 0,
                    "totalPayout": 0,
                    "timestampUpdate": Date.now(),
                    "timestampFirstStart": Date.now(),
                }
            }
            await db.put('1xSTATS', stats)
        }
        return (stats)
    }
}