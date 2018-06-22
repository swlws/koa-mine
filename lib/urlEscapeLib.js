
'use strict';

/**
 * url转码，一定程度上防止MongoDB注入攻击，XSS攻击
 */
async function urlEscape(ctx, next) {
    let req = ctx.request;
    console.log('urlEacspe', req.url);

    req.url = req.url.replace(new RegExp(/\{/g), '\\{');
    req.url = req.url.replace(new RegExp(/\}/g), '\\}');
    req.url = req.url.replace(new RegExp(/\[/g), '\\[');
    req.url = req.url.replace(new RegExp(/\]/g), '\\[');
    req.url = req.url.replace(new RegExp(/\(/g), '\\(');
    req.url = req.url.replace(new RegExp(/\)/g), '\\)');
    req.url = req.url.replace(new RegExp(/\./g), '\\.');
    req.url = req.url.replace(new RegExp(/\;/g), '\\;');

    await next();
}
exports.urlEscape = urlEscape;