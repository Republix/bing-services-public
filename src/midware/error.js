const sysLogger = require('../services/logs').system

module.exports.appErrorHandler = (err, ctx) => {
    sysLogger.error('@SYS_ERR', err)
}