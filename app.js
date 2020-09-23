const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const jsonFile = require('jsonfile');
const appConfig = jsonFile.readFileSync('./config.json'); // конфиг

process.env.PORT = appConfig.port;
console.log("Running on port:", process.env.PORT);

const indexRouter = require('./routes/index');
const rewarderRouter = require('./routes/rewarder');

const apiRouter = require('./routes/v2/api');

const app = express();
app.disable('x-powered-by');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use('/', indexRouter);
app.use('/rewarder', rewarderRouter);

app.use('/v2/api', apiRouter);

module.exports = app;
