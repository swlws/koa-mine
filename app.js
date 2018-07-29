'use strict';

// load opensource code
const Koa = require('koa');
const staticServer = require('koa-static');
const KoaRouter = require('koa-router');
const bodyParser = require('koa-bodyparser');

// load self code
const logger = require('./lib/logLib.js').GetLogger();

// load config
const configReader = require('./lib/configReaderLib');

// global varible
const app = new Koa();
const route = new KoaRouter();
const sreversConfig = configReader.loadServerConfig();
const port = sreversConfig.port;
const getMethod = sreversConfig.get;
const postMethod = sreversConfig.post;

// url转码，一定程度上防止MongoDB注入攻击，XSS攻击
// app.use(require(__dirname + '/lib/urlEscapeLib').urlEscape);

app.use(staticServer(__dirname + '/static'));

/**
 * 访问日志
 * 
 */
app.use(async (ctx, next) => {
    let remoteIP = ctx.request.ip;
    let origin = ctx.request.origin;
    let url = ctx.request.url;
    logger.info(`Remote IP: ${remoteIP} --> ${origin}${url}`);
    await next();
});

// POST参数解析
app.use(bodyParser({
    onerror: function (err, ctx) {
        ctx.throw('body parse error', 422);
    }
}));

/**
 * GET、POST参数解析，将参数统一放置在ctx.params中
 * 
 */
app.use(async (ctx, next) => {
    if (ctx.request.method === 'GET') {
        ctx.params = ctx.request.query;
    } else if (ctx.request.method === 'POST') {
        ctx.params = ctx.request.body;
    }
    await next();
});

/**
 * 获取请求处理方法
 * 
 * @param {String} path 文件路径
 * @param {String} method 方法名
 */
function getRoutesHandle(path, method) {
    var res = require(path);
    var ret = res[method];
    return ret;
}

// GET请求加载
getMethod.forEach(e => {
    route.get(e.url, getRoutesHandle(e.file, e.func));
});

// POST请求加载
postMethod.forEach(e => {
    route.post(e.url, getRoutesHandle(e.file, e.func));
});

app.use(route.routes()).use(route.allowedMethods());

app.listen(port, () => {
    logger.info(`App Listen On ${port} Port1`);
});

