// reward worker
const request = require('request');
const util = require("./api/util");
const scheduler = require("node-schedule");
const jsonReader = require('jsonfile');
const rConfig = jsonReader.readFileSync("./config.json");

let url = 'http://127.0.0.1:' + rConfig.port + '/api/voters/update';
util.log("Worker started:" + 'http://127.0.0.1:' + rConfig.port);

//let workSchedule = scheduler.scheduleJob("*/10 * * * * *", () => {
    request({
        method: 'post',
        json: true, // Use,If you are sending JSON data
        url: url,
        body: {},
        headers: {
            "accept": "application/json",
            "x-api-key": rConfig.appKey
        }
    }, function (err, res, body) {
        console.log(body);
    });
//});
