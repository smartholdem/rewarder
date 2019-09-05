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
        if (forgingData) {
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

    async getVoters(PubKey) {
        let activeVoters = []
        return new Promise((resolve, reject) => {
            smartholdemApi.getVoters(PubKey, (error, success, response) => {
                if (!error) {
                    for (let i = 0; i < response.accounts.length; i++) {
                        activeVoters.push({
                            "address": response.accounts[i].address,
                            "balance": response.accounts[i].balance
                        })
                    }
                    resolve(activeVoters);
                }
                reject(activeVoters)
            })
        })
    }

    async removeUnvotedUsers(PubKey) {
        let listRemoved = [];
        let chainVoters = await this.getVoters(PubKey)
        db.createReadStream({gte: '0x', lt: '1x', "limit": 500})
            .on('data', function (data) {
                let remove = true;
                for (let i=0; i < chainVoters.length; i++) {
                    if (chainVoters[i].address === data.value.address) {
                        remove = false
                        break
                    }
                }
                if (remove) {
                    db.del(data.key)
                    listRemoved.push(data.key)
                }
            })
            .on('end', function () {
                return true
            })
    }

}

const rewarder = new Rewarder()


module.exports = router