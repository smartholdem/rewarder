const jsonReader = require('jsonfile');
const rConfig = jsonReader.readFileSync("./config.json");
const sth = require("sthjs");
const PUB_KEY = sth.crypto.getKeys(rConfig.secret).publicKey;
const ADDRESS = sth.crypto.getAddress(PUB_KEY);

console.log('PUB_KEY',PUB_KEY);
console.log('ADDRESS',ADDRESS);
