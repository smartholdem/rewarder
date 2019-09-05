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