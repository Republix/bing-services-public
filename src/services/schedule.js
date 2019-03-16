/**
 * 运行日程表
 */

const Schedule = require('node-schedule'),
    logger = require('../services/logs').app,
    BingServices = require('./bing'),
    MailServices = require('./mail')

// 计划时间表
const TASK_TIMING = {
    SAVE_BING_DETAIL: '00 00 1 * * *',
    WEEK_MAIL_REPORT: '00 00 8 * * 1',
}

class Task {
    constructor () {}

    /**
     * 每天定时存储bing数据
     */
    static async bingImageDaily () {

        Schedule.scheduleJob(
            TASK_TIMING.SAVE_BING_DETAIL, 
            () => {
                BingServices.saveBingDaily({warning: true}) // 请求时开启邮件预警
            }
        )
    }

    static async weekMailReport () {

        Schedule.scheduleJob(
            TASK_TIMING.WEEK_MAIL_REPORT, 
            MailServices.sendWeekMail
        )
    }


    static developTask () {
        // MailServices.sendErrorReportMail('test', {err: {err: 'test'}})
    }
}


/**
 * 随项目启动时运行的service
 */
const autoStartTask = async () => {

    logger.info(`#Schedule# 计划表运行 ${process.env.NODE_ENV || 'unset'}`)
    // 每日必应活动
    Task.bingImageDaily()
    // 每周邮件发送服务
    Task.weekMailReport()

    Task.developTask()
}

module.exports.autoStart = autoStartTask
