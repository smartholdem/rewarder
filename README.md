# SmartHoldem Delegate - Automatic Rewards Voters

Recalculation of rewards occurs every 30 minutes.

## Install

```
git clone https://github.com/smartholdem/rewarder.git
cd rewarder
npm install
```

## Settings

Rename sample.config.json > config.json and set params

```
mv sample.config.json config.json
nano config.json
```

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
    "address": "SAg1sta3Wu5EHaj8Mo6kFUJQatWNk7caDE",
    "balance": "136500340000000",
    "reward": 209000000,
    "timestamp": 1544065201171,
    "personalPercent": 100
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

