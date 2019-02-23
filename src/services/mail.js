const CONFIG = require('../config'),
    logger = require('../midware/log4j').app_logger,
    redisInstance = require('./redis').Instance,
    NodeMailer = require('nodemailer'),
    utils = require('../common/utils'),
    fs = require('fs'),
    path = require('path'),
    ejs = require('ejs')


class Email {
    constructor () {
        // ejs 渲染方式
        // const template = ejs.compile(fs.readFileSync(path.resolve(__dirname, './annex/email.ejs'), 'utf8'))
        // const renderHtml = template({ content: 'report' })

        this.mailOptions = {}
        this.mailOptions.html = ''

        this.transporterOptions = CONFIG.MAIL_DEFAULT_TRANSPORT 
        
        this.transporter = NodeMailer.createTransport(this.transporterOptions)
        logger.info('创建mail transporter完成')
    }

    async sendMail ({ config, content }) {

        let suc = null // @return 是否成功
        let error = null // 错误信息
        let context = config.html // 发送文本

        const doSend = () => {
            return new Promise((resolve, reject) => {
                this.transporter.sendMail(config, (err, doc) => {
                    if (err) {
                        suc = false
                        try {
                            error: JSON.stringify(err)
                        } catch (e) {
                            error: String(err)
                        }
                        resolve()
                        return
                    }
                    suc = true
                    doc.context = context

                    try {
                        context = JSON.stringify(doc)
                    } catch (e) {
                        context = 'parse error' + String(doc)
                    }
                    resolve()
                })
            })
        }
        await doSend()

        return {
            suc,
            error,
            context
        }
    }

}

const mail = new Email()

const BING_STORY_KEY = 'bing_storys'
const REDIS_MAIL_SUC_TYPE = 'mail_bing_send' // 邮件发送成功记录
const REDIS_MAIL_FAILED_TYPE = 'mail_bing_error' // 邮件发送失败记录

const REDIS_MAIL_KEY = (str = '') => {
    return str + utils.formatTime(new Date(), 'yyyyMMdd')
}


const EmailServices = {
    
    /**
     * 每周发送统计邮件
     */
    async sendWeekMail () {

        const allSaveData = (await redisInstance.hashGetAllValues(BING_STORY_KEY)).detail
        const allSaveCount = allSaveData ? allSaveData.length : 0
        const statisticalTime = utils.formatTime(new Date(), 'yyyy-MM-dd hh:mm:ss')

        const weeklyMailContext = {
            from: '810242127@qq.com',
            to: 'asunmatch@outlook.com',
            subject: 'BingProxyServer-WeeklyReports',
            html: `<table><tr><td>${statisticalTime}</td></tr><tr><td>saveCount: ${allSaveCount}</td></tr></table>`
        }

        const result = await mail.sendMail({ config: weeklyMailContext })

        if (result.suc) { // 发送成功
            logger.info('发送每周邮件成功')
            redisInstance.hashSet(REDIS_MAIL_SUC_TYPE, REDIS_MAIL_KEY('weekly'), result.context)
        } else {
            logger.error('发送每周邮件失败', result.error)
            redisInstance.hashSet(REDIS_MAIL_FAILED_TYPE, REDIS_MAIL_KEY('weekly'), result.error)
        }

    },

    async sendErrorReportMail (errorTitle = '未命名错误', errorContent = '注意排查') {
        const statisticalTime = utils.formatTime(new Date(), 'yyyy-MM-dd hh:mm:ss')
        // errorContent 转换
        if (typeof errorContent === 'object') {
            try {
                errorContent = JSON.stringify(errorContent)
            } catch (e) {
                errorContent = '未知错误'
            }
        } 

        const mailContext = {
            from: '810242127@qq.com',
            to: 'asunmatch@outlook.com',
            subject: `BingProxyServer-Error-${errorTitle}`,
            html: `<table><tr><td>${statisticalTime}</td></tr><tr><td>${errorTitle}error: ${errorContent}</td></tr></table>`
        }

        const result = await mail.sendMail({ config: mailContext })
        if (result.suc) { // 发送成功
            logger.info(`<捕获错误邮件: ${errorTitle}> 发送成功`)
            redisInstance.hashSet(REDIS_MAIL_SUC_TYPE, REDIS_MAIL_KEY('catch_detail_savee_error'), result.context)
        } else {
            logger.error(`<捕获错误邮件>: ${errorTitle} 发送失败`, result.error)
            redisInstance.hashSet(REDIS_MAIL_FAILED_TYPE, REDIS_MAIL_KEY('catch_detail_savee_error'), result.error)
        }
    }
    // todo 可选每日邮件
}


module.exports= EmailServices
