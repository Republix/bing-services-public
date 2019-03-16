const crossOrigin = require('koa2-origin-cors'),
    Config = require('../config')

module.exports = () => {
    return crossOrigin(Config.CORSS)
}