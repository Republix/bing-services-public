const log4js = require('log4js')
// const utils = require('../common/utils')

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


const LOG_STORE_PATH = './logs' // no '/' end


log4js.configure({
    appenders: { 
        // 普通打印
        print: { type: 'console' },
        // app事件
        app: { type: 'file', filename: `${LOG_STORE_PATH}/app-event.log` },
        // 接口访问
        api: { type: 'file', filename: `${LOG_STORE_PATH}/api-request.log` },
        // 系统事件
        system: { type: 'file', filename: `${LOG_STORE_PATH}/system.log`},
        // cookies记录
        save_cookie: { type: 'file', filename: `${LOG_STORE_PATH}/cookies-request.log` },
        // 按日期记录
        record: { type: 'dateFile', filename: `${LOG_STORE_PATH}/z-9-rec-`, pattern: 'yyyy-MM-dd.log', maxLogSize: 30 * 1000 * 1000, alwaysIncludePattern: true },
        // auth验证
        auth: { type: 'file', filename: `${LOG_STORE_PATH}/auth-api.log` }

    },  
    categories: { 
        // 默认
        default: { appenders: ['print'], level: 'debug' },
        // api访问
        api: { appenders : ['print', 'api'], level: 'info' },
        // app事件
        app: { appenders: ['print', 'app'], level: 'info' },
        // 系统事件
        system: { appenders: ['print', 'system'], level: 'info' },
        // 验证，验证前置
        auth: { appenders: ['print', 'auth'], level: 'info' },
        // cookie记录触发
        cookie: { appenders: ['save_cookie'], level: 'info' },
    },
})

// 实体
module.exports.log4js = log4js

// categories
module.exports.print = log4js.getLogger()
module.exports.app = log4js.getLogger('app')
module.exports.system = log4js.getLogger('system')
module.exports.api = log4js.getLogger('api')
module.exports.auth = log4js.getLogger('auth')
module.exports.cookie = log4js.getLogger('cookie')