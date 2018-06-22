'use strict';

/**
 * 加载所有用户
 * 
 */
function getUsers(ctx) {
    ctx.body = [{ name: 'xx', age: 12 }, { name: 'mm', age: 13 }];
}
exports.getUsers = getUsers;

/**
 * 加载单个用户
 * 
 */
function getUser(ctx) {
    ctx.body = { name: 'mm', age: 13 };
}
exports.getUser = getUser;

