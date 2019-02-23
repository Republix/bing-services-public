const log4js = require('log4js')
const util = require('../common/utils')


/**
 * log4js 
 * ALL < TRACE < DEBUG < INFO < WARN < ERROR < FATAL < MARK < OFF
 * >= 输入等级时才会被输出
 * 
 * appenders: 配置文件输出源 分 console, file, dateFile(以pattern属性时间格式命名文件) 三种
 * 
 * replaceConsole: 是否替换控制台输出，当代码出现console.log，表示以日志type=console的形式输出
 * 
 */



log4js.configure({
    appenders: { 
        print: { type: 'console' },
        app: { type: 'file', filename: '../logs/app-event.log' }, // app 事件 
        middle: { type: 'file', filename: '../logs/middle-request.log' }, // 中间件
        system: { type: 'file', filename: '../logs/system.log'}, // 系统事件
        save_cookie: { type: 'file', filename: '../logs/cookies-request.log' }, // cookies记录
        record: { type: 'dateFile', filename: '../logs/z-9-rec-', pattern: 'yyyy-MM-dd.log', maxLogSize: 30 * 1000 * 1000, alwaysIncludePattern: true } // 按日期记录
    },  
    categories: { 
        default: { appenders: ['print'], level: 'debug' },
        req_cookie_file: { appenders: ['save_cookie'], level: 'debug' },
        mid_ctg: { appenders : ['print', 'middle'], level: 'info' },
        app_ctg: { appenders: ['print', 'app'], level: 'info' },
        sys_ctg: { appenders: ['print', 'system'], level: 'info' }
    },
})



module.exports.middle = () => {

    let logger_file = log4js.getLogger('mid_ctg')

    return async function (ctx, next) {
        const date = util.formatTime(new Date(), 'hh:mm:ss:S MM-dd-yyyy')

        const log_title = '#req# ',
            req_method = `[${ctx.request.method}] `,
            req_target = `target: ${ctx.request.url} `,
            req_origin = `origin: ${ctx.request.origin} ip: ${ctx.request.ip} `,
            req_agent = `ua: ${ctx.request.header['user-agent']} `

        let _output = log_title + date + ' ' + req_method + req_target +  req_origin
        let _record = _output + ctx.request.href + ' ' + ctx.request.ip + req_agent

        logger_file.info(_output)
        if (ctx.request.header.cookie) {
            let cookieLogger = log4js.getLogger('req_cookie_file')
            let _cookie_record = _record + ctx.request.header.cookie
            cookieLogger.info(_cookie_record)
        }
        
        ctx.rao = 'rao#flag'

        await next()
    }
}

module.exports.print_logger = log4js.getLogger()
module.exports.app_logger = log4js.getLogger('app_ctg')
module.exports.system_logger = log4js.getLogger('sys_ctg')
module.exports.middle_logger = log4js.getLogger('mid_ctg')