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
sh stop.sh
git pull
npm install
sh restart.sh
```

## Public API


# IMPORTANT NOTE

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.
