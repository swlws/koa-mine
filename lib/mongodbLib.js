'use strict';

// load opensource code
const MongoClient = require('mongodb').MongoClient;

// load self code

let log = require('./logLib.js').GetLogger(); 

// load config
let configReader = require('./configReaderLib.js');
const mongoCfg = configReader.loadDbConfig();

// global varible
let GlbClient = (void 0);


/**
 * 获取数据库实例，如已存在直接返回，如不存在，新连接一个
 * 使用mongodb驱动内部支持的pool
 * http://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html#mongoclient-connection-pooling
 */
async function getDBInstance() {
    log.debug(`Enter [mongolib.getDBInstance]`);

    if (GlbClient && GlbClient.isConnected()) {
        return GlbClient.db(mongoCfg.database);
    } else {
        // 如果没有连接，重新连接
        try {
            let DBConnString = `mongodb://${mongoCfg.host}:${mongoCfg.port}/${mongoCfg.database}`;
            let connectOpt = {
                forceServerObjectId: mongoCfg.forceServerObjectId,
                loggerLevel: mongoCfg.loggerLevel,
                poolSize: mongoCfg.poolSize,
                j: mongoCfg.journal
            };

            if (mongoCfg.needAuth) {
                connectOpt.authMechanism = mongoCfg.authMechanism;

                connectOpt.auth = {
                    user: mongoCfg.user,
                    password: mongoCfg.password
                };
            }

            // Use connect method to connect to the Server
            GlbClient = await MongoClient.connect(DBConnString, connectOpt);

            return GlbClient.db(mongoCfg.database);
        } catch (error) {
            log.error(error.stack);

            return Promise.reject(error.stack);
        }
    }
}
exports.getDBInstance = getDBInstance;


async function close() {
    log.debug(`Enter [mongolib.close]`);

    try {
        if (GlbClient && GlbClient.isConnected()) {
            await GlbClient.close();
        }
    } catch (error) {
        log.error(error.stack);

        return Promise.reject(error.stack);
    }
}
exports.close = close;


/*
 * 使用maxTimeMS选项设置操作最大超时值
 * http://mongodb.github.io/node-mongodb-native/3.0/reference/faq/
 * 
 * 支持maxTimeMS选项的操作：
 *      aggregate
 *      count
 *      distinct
 *      dropIndex
 *      dropIndexes
 *      find
 *      findOne
 *      findOneAndDelete
 *      findOneAndReplace
 *      findOneAndUpdate 
 */

/**
 * 根据query查询集合collection,返回对应集合里面的匹配到的第一个记录
 * 
 * @param {String} collectName        集合的名字
 * @param {Object} query              查询条件
 * @param {Object} projection         字段过滤
 * @param {Array|Object} sort         排序
 * @param {Number} skip               跳过文档数目
 * @returns {Promise-resolve-Object}   由多个记录文档组成的Array
 * http://127.0.0.1:8080/mongo/core/aggregation-pipeline-optimization.html
 */
async function findOne(collectName, query = {}, projection = null, sort = null, skip = 0) {
    log.debug(`Enter [mongolib.findOne]: ${collectName}`);

    try {
        const db = await getDBInstance();
        const collect = await db.collection(collectName);
        let options = {
            projection: projection,
            sort: sort,
            skip: skip,
            maxTimeMS: mongoCfg.maxTimeMS
        };

        return await collect.findOne(query, options);
    } catch (error) {
        log.error(error.stack);

        return Promise.reject(error.stack);
    }
}
exports.findOne = findOne;


/**
 * 根据query查询集合collection,返回对应集合里面的所有查询到的记录
 *
 * @param {String} collectName        集合的名字
 * @param {Object} query              查询条件
 * @param {Object} projection         字段过滤
 * @param {Array|Object} sort         排序
 * @param {Number} skip               跳过文档数目
 * @returns {Promise-resolve-Array}   由多个记录文档组成的Array
 * http://127.0.0.1:8080/mongo/core/aggregation-pipeline-optimization.html
 */
async function find(collectName, query = {}, projection = null, sort = null, skip = 0, limit = 0) {
    log.debug(`Enter [mongolib.find]: ${collectName}`);

    try {
        const db = await getDBInstance();
        const collect = await db.collection(collectName);
        let options = {
            projection: projection,
            sort: sort,
            skip: skip,
            limit: limit,
            maxTimeMS: mongoCfg.maxTimeMS
        };

        return await collect.find(query, options);
    } catch (error) {
        log.error(error.stack);

        return Promise.reject(error.stack);
    }
}
exports.find = find;


/**
 * 将data指定的单个记录插入collection指定的集合中
 * 
 * @param {String} collectName         集合的名字
 * @param {Object} doc                 具体插入的数据
 * @returns {Promise-resolve-Object}   具体插入的数据
 */
async function insertOne(collectName, doc) {
    log.debug(`Enter [mongolib.insertOne]: ${collectName}`);

    try {
        const db = await getDBInstance();
        const collect = await db.collection(collectName);
        let options = {
            wtimeout: mongoCfg.maxTimeMS,
            forceServerObjectId: false
        };

        let r = await collect.insertOne(doc, options);
        let successFlag = ((r.result.ok === 1) && (r.result.n === 1));

        if (successFlag) {
            return doc;
        } else {
            let insertOneErr = new Error(`insertOne successFlag: [${successFlag}]`);
            insertOneErr.name = 'insertOneErr';

            return Promise.reject(insertOneErr.stack);
        }
    } catch (error) {
        log.error(error.stack);

        return Promise.reject(error.stack);
    }
}
exports.insertOne = insertOne;


/**
 * 将objs指定的多个记录插入collection指定的集合中
 * 
 * @param {String} collectName        集合的名字
 * @param {Array}  docs               具体插入的数据
 * @returns {Promise-resolve-Array}   具体插入的数据
 */
async function insertMany(collectName, docs) {
    log.debug(`Enter [mongolib.insertMany]: ${collectName}`);

    try {
        const db = await getDBInstance();
        const collect = await db.collection(collectName);
        let options = {
            wtimeout: mongoCfg.maxTimeMS
        };

        let r = await collect.insertMany(docs, options);
        let successFlag = ((r.result.ok === 1) && (r.result.n === docs.length));

        if (successFlag) {
            return docs;
        } else {
            let insertManyErr = new Error(`insertManyErr successFlag: [${successFlag}]`);
            insertManyErr.name = 'insertManyErr';

            return Promise.reject(insertManyErr.stack);
        }
    } catch (error) {
        log.error(error.stack);

        return Promise.reject(error.stack);
    }
}
exports.insertMany = insertMany;


/**
 * 删除一个匹配条件的文档
 * 
 * @param {String}  collectName    集合的名字 
 * @param {String}  filter         查询条件
 */
async function deleteOne(collectName, filter) {
    log.debug(`Enter [mongolib.deleteOne]: ${collectName}`);

    try {
        const db = await getDBInstance();
        const collect = await db.collection(collectName);

        let options = {
            wtimeout: mongoCfg.maxTimeMS
        };

        let r = await collect.deleteOne(filter, options);
        let successFlag = (r.result.ok === 1);

        if (successFlag) {
            return r.result.n;
        } else {
            let deleteOneErr = new Error(`deleteOneErr successFlag: [${successFlag}]`);
            deleteOneErr.name = 'deleteOneErr';

            return Promise.reject(deleteOneErr.stack);
        }
    } catch (error) {
        log.error(error.stack);

        return Promise.reject(error.stack);
    }
}
exports.deleteOne = deleteOne;


/**
 * 删除所有匹配条件的文档
 * 
 * @param {String}  collectName    集合的名字 
 * @param {String}  filter         查询条件
 */
async function deleteMany(collectName, filter) {
    log.debug(`Enter [mongolib.deleteMany]: ${collectName}`);

    try {
        const db = await getDBInstance();
        const collect = await db.collection(collectName);

        let r = await collect.deleteMany(filter);
        let successFlag = (r.result.ok === 1);

        if (successFlag) {
            return r.result.n;
        } else {
            let deleteManyErr = new Error(`deleteManyErr successFlag: [${successFlag}]`);
            deleteManyErr.name = 'deleteManyErr';

            return Promise.reject(deleteManyErr.stack);
        }
    } catch (error) {
        log.error(error.stack);

        return Promise.reject(error.stack);
    }
}
exports.deleteMany = deleteMany;


/**
 * 删除集合
 * 
 * @param {String}  collectName    集合的名字 
 */
async function drop(collectName) {
    log.debug(`Enter [mongolib.drop]: ${collectName}`);

    try {
        const db = await getDBInstance();
        const collect = await db.collection(collectName);

        let successFlag = await collect.drop();

        if (successFlag) {
            return successFlag;
        } else {
            let dropErr = new Error(`dropErr successFlag: [${successFlag}]`);
            dropErr.name = 'dropErr';

            return Promise.reject(dropErr.stack);
        }
    } catch (error) {
        log.error(error.stack);

        return Promise.reject(error.stack);
    }
}
exports.drop = drop;


/**
 * 
 * @param {String} collectName         集合的名字
 * @param {Object} filter              匹配条件
 * @param {Object} update              具体更新的数据
 * @param {Object} sort                排序条件
 * @returns {Promise-resolve-Object}   更新后的数据
 * 
 * http://127.0.0.1:8080/mongo/reference/method/db.collection.findOneAndUpdate.html
 */
async function findOneAndUpdate(collectName, filter, update, sort = null) {
    log.debug(`Enter [mongolib.findOneAndUpdate]: ${collectName}`);

    try {
        const db = await getDBInstance();
        const collect = await db.collection(collectName);

        let options = {
            maxTimeMS: mongoCfg.maxTimeMS,
            upsert: true,
            sort: sort,
            returnOriginal: false //返回修改后的文档
        };

        let r = await collect.findOneAndUpdate(filter, update, options);
        let successFlag = (r.ok === 1);

        if (successFlag) {
            return r.value;
        } else {
            let findOneAndUpdateErr = new Error(`findOneAndUpdateErr successFlag: [${successFlag}]`);
            findOneAndUpdateErr.name = 'findOneAndUpdateErr';

            return Promise.reject(findOneAndUpdateErr.stack);
        }
    } catch (error) {
        log.error(error.stack);

        return Promise.reject(error.stack);
    }
}
exports.findOneAndUpdate = findOneAndUpdate;


/**
 * 
 * @param {String} collectName         集合的名字
 * @param {Object} filter              匹配条件
 * @param {Object} update              具体更新的数据
 * @param {Object} options             选项
 * 
 * 1. 如果匹配到多个文档，则对匹配到的第一个文档进行update操作，其他的文档不会被影响
 * 2. 如果匹配到单个文档，则对该文档进行update操作
 */
async function updateOne(collectName, filter, update, options) {
    log.debug(`Enter [mongolib.updateOne]: ${collectName}`);

    try {
        const db = await getDBInstance();
        const collect = await db.collection(collectName);

        let optObj = Object.assign({}, options);
        optObj.wtimeout = mongoCfg.maxTimeMS;

        let r = await collect.updateOne(filter, update, optObj);
        let successFlag = (r.result.ok === 1);

        if (successFlag) {
            return r.upsertedId;
        } else {
            let updateOneErr = new Error(`updateOneErr successFlag: [${successFlag}]`);
            updateOneErr.name = 'updateOneErr';

            return Promise.reject(updateOneErr.stack);
        }
    } catch (error) {
        log.error(error.stack);

        return Promise.reject(error.stack);
    }
}
exports.updateOne = updateOne;


/**
 * 
 * @param {String} collectName         集合的名字
 * @param {Object} filter              匹配条件
 * @param {Object} update              具体更新的数据
 * @param {Object} options             选项
 * @returns {Promise-resolve-Object}   更新后的数据(更新的字段)/null
 */
async function upsertMany(collectName, filter, update, options) {
    log.debug(`Enter [mongolib.upsertMany]: ${collectName}`);

    try {
        const db = await getDBInstance();
        const collect = await db.collection(collectName);

        let optObj = Object.assign({}, options);
        optObj.wtimeout = mongoCfg.maxTimeMS;

        let r = await collect.updateMany(filter, update, optObj);
        let successFlag = (r.result.ok === 1);

        if (successFlag) {
            return r.upsertedId;
        } else {
            let upsertManyErr = new Error(`upsertManyErr successFlag: [${successFlag}]`);
            upsertManyErr.name = 'upsertManyErr';

            return Promise.reject(upsertManyErr.stack);
        }
    } catch (error) {
        log.error(error.stack);

        return Promise.reject(error.stack);
    }
}
exports.upsertMany = upsertMany;