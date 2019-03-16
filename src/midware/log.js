const apiLogger = require('../services/logs').api
const cookieLogger = require('../services/logs').cookie


/**
 * 返回中间件，
 * need return Function
 */
module.exports = (flag = '') => {

    return async function ({request}, next) {
        // const date = utils.formatTime(new Date(), 'hh:mm:ss:S MM-dd-yyyy')

        const outputStr = `[${request.method}]T: ${request.url} ip: ${request.ip} O: ${request.origin} UA: ${request.header['user-agent']}`
        apiLogger.info(
            flag ? 
                `[${flag}]` + outputStr :
                outputStr
        )

        if (request.header.cookie) {
            const cookieStr = outputStr + request.header.cookie
            cookieLogger.info(
                flag ?
                    `[${flag}]` + cookieStr :
                    cookieStr
            )
        }
        
        await next()
    }
}