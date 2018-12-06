# SmartHoldem Delegate - Automatic Rewards Voters

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
```

## Run

```
sh restart.sh
```

## API

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


