# SmartHoldem Delegate - Automatic Rewards Voters v2

Recalculation of rewards occurs every 30 minutes.

## Install

```
git clone https://github.com/smartholdem/rewarder.git
cd rewarder
npm install
```

## Settings


1. Rename sample.config.json > config.json and set params

```
mv sample.config.json config.json
nano config.json
```

2. Config Params

```js
{
    "node": "127.0.0.1", // SmartHoldem Node IP
    "secret": "secret passphrase delegate", // Secret Pass Phrase Delegate for payments & get stats
    "secondSecret": null,
    "port": 3007, // rewarder APP port
    "percent": 50, // The percentage of payments from the amount of forging
    "day": 15, // Payment period in days to voters
    "msg": "reward",
    "daysPending": 3,
    "minVote": 500, // The minimum voice weight for the calculation of payments
    "log": "reward.log",
    "globalStatsAPI": "https://rewarder.smartholdem.io", // global statistics api server
    "dev": false
}
```

## Run

```
sh restart.sh
```

## Delegate Personal Page

```
http://host_ip:3007/
```

## Update

```
cd rewarder
git pull
sh restart.sh
```

## Public API

### Get Stats

```
GET http://127.0.0.1:3007/api/db/stats
```

result

```json
{
  "startedForgedAmount": 2634.2,
  "currentForgedAmount": 2634.4,
  "totalRewardAmount": 0.2,
  "totalPayout": 0,
  "timestampUpdate": 1544056973996,
  "timestampFirstStart": 1544056926399
}
```

### Get Voters from chain

```
GET http://127.0.0.1:3007/api/voters/getFromChain
```

result

```json
[
  {
    "address": "SX6tVqCamHj2wDBdoqVmLBy9pUbKhKCw31",
    "balance": "11122230000000"
  }
]
```

### Get Active Voters from DB

```
GET http://127.0.0.1:3007/api/voters/getFromDb
```

information is available after the first recount

result

```json
[
 {
   "address": "SbpBLz4yBDHqsS1F3msKM3e44jNCWc6rXf",
   "balance": "7141043214012",
   "reward": 3164256,
   "timestamp": 1544074201177,
   "personalPercent": 6.5922
 },
 {
   "address": "Sh2AmBRP5WH1JAtkREwv3hBPkpgMuo5nQY",
   "balance": "60453730000000",
   "reward": 26787744,
   "timestamp": 1544074201178,
   "personalPercent": 55.8078
 },
 {
   "address": "SPBJ65i1H2qyUuv8mFEWZEqWHrGF4QUwe9",
   "balance": "30356730000000",
   "reward": 13451424,
   "timestamp": 1544074201178,
   "personalPercent": 28.0238
 },
 {
   "address": "Sa8EKhbkEbtaHqM461bTcCTpHcBmk7Wo2f",
   "balance": "10373400000000",
   "reward": 4596576,
   "timestamp": 1544074201178,
   "personalPercent": 9.5762
 }
]
```

### Get Delegate info by name

```
GET http://127.0.0.1:3007/api/delegate/nrz
```

result

```json
{
  "success": true,
  "delegate": {
    "username": "barzelgor",
    "address": "SadnAkM8RvhKBbP3o7xGxkUJ3E92ZTYVk2",
    "publicKey": "02c5ccbc6f2f56460fc274ba604ba819ab6c4b5a9ff6d89f4a24013b61a994c510",
    "vote": "345619830000000",
    "producedblocks": 57559,
    "missedblocks": 861,
    "rate": 1,
    "approval": 1.4,
    "productivity": 98.53
  }
}
```

### RecurrenceRule properties
- hour (0-23)
- date (1-31)
- month (0-11)
- dayOfWeek (0-6) Starting with Sunday

# IMPORTANT NOTE

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.
