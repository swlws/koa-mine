var bunyan = require('bunyan');
var config = require('./configReaderLib.js').loadLogConfig();

var Log = bunyan.createLogger({
    src: true,
    name: 'mine',
    streams: [
        {
            type: 'rotating-file',
            level: 'error',
            path: 'log/log_error.log',// 日志输出到文件
            period: '1d', // daily rotation
            count: 3, // keep 3 back copies
        },
        {
            type: 'rotating-file',
            level: config.level === undefined ? 'info' : config.level,
            path: 'log/log_info.log',// 日志输出到文件
            period: '1d', // daily rotation
            count: 3 // keep 3 back copies
        },
        {
            level: 'debug',
            stream: process.stdout
        }
    ]
});

if (process.argv[2] === 'mine') {
    Log.streams.pop();
}


Log.shouldTrace = function () {
    return Log.level() <= bunyan.TRACE;
};

Log.shouldDebug = function () {
    return Log.level() <= bunyan.DEBUG;
};

Log.shouldInfo = function () {
    return Log.level() <= bunyan.INFO;
};

Log.shouldWarn = function () {
    return Log.level() <= bunyan.Warn;
};

Log.shouldError = function () {
    return Log.level() <= bunyan.ERROR;
};

Log.shouldFatal = function () {
    return Log.level() <= bunyan.FATAL;
};

module.exports.GetLogger = function () {
    return Log;
};
