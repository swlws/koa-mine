'use strict';

// load opensource code

// load self code

// load config

// global varible
let logConfigPath = __dirname + '/../config/logConfig';
let dbConfigPath = __dirname + '/../config/dbConfig';
let serverConfig = __dirname + '/../config/serverConfig';

/**
 * 加载日志配置
 * 
 */
function loadLogConfig() {
    return require(logConfigPath);
}
exports.loadLogConfig = loadLogConfig;

/**
 * 加载数据库配置
 * 
 */
function loadDbConfig() {
    return require(dbConfigPath);
}
exports.loadDbConfig = loadDbConfig;

/**
 * 加载服务配置
 * 
 */
function loadServerConfig() {
    return require(serverConfig);
}
exports.loadServerConfig = loadServerConfig;