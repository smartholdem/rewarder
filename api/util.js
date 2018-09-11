"use strict";
const fs = require("fs");

exports.reject = (res, status, msg) => {
    console.log(`Rejected: ${status} - ${msg}`);
    let resp = {
        success: false,
        message: msg
    };
    res.status(status);
    res.send(resp);
}

exports.log = (msg, async) => {
    console.log(msg);
    if (async)
        fs.appendFile(LOG_FILE, msg);
    else
        fs.appendFileSync(LOG_FILE, msg);
};
