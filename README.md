# SmartHoldem Delegate - Automatic Rewards Voters

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

{
  "node": "127.0.0.1", // SmartHoldem Node IP
  "delegate": "delegatename", // Your Delegate Name
  "secret": "secret 12 mnemo-words from delegate address", // Secret Pass Phrase Delegate for payments
  "appKey": "appSecretKey", // Local Server Secret Key !be sure to install your
  "port": 3007, // rewarder APP port
  "rewardPercent": 60, // The percentage of payments from the amount of forging
  "rewardPeriodDays": 7, // Payment period in days to voters
  "rewardTime": "2:5:12", // H:m:s payment time, in 2 hours 5 minutes 12 sec
  "voterWeightMin": 500, // The minimum voice weight for the calculation of payments
  "log": "rewarder.log",
  "service": true // For the future front-end
}

## Run

```
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


# IMPORTANT NOTE

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.
