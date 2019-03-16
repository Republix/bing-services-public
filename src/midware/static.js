const static = require('koa-static')
const path = require('path')
const CONFIG = require('../config')


module.exports.initial = (app) => {

    CONFIG.STATIC_CLIENT_PATH && app.use(static(path.join(process.cwd(), CONFIG.STATIC_CLIENT_PATH)))

    app.use(static(path.join(process.cwd(), CONFIG.STATIC_PATH)))

}
