/**
 * 配置文件
 * 需要 Redis, Mongodb 支持
 */

let CONFIG = {}

switch (process.env.NODE_ENV + '') {
    case "development":
        CONFIG = require('../env/develop.config')
        break
    case 'product':
        CONFIG = require('../env/prod.config')
        break
    default:
        CONFIG = require('../env/default.config')
        break
}


module.exports = CONFIG
