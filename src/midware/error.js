const sysLogger = require('./log4j').system_logger

module.exports.appErrorHandler = (err, ctx) => {

    // catch 404
    if (ctx.response.status === '404') {
        return
    }

    sysLogger.error('@SYS_ERR', err)
}
