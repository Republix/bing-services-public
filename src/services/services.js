/**
 * 主Service
 */

const superagent = require('superagent'),
    CONFIG = require('../config'),
    logger = require('../midware/log4j').app_logger,
    redisInstance = require('./redis').Instance,
    utils = require('../common/utils')

const StoreService = require('./store')
const MailSercice = require('./mail')

const BING_STORY_KEY = 'bing_storys'

// 特有流程utils
const helper = {
    /**
     * 检测保存数据是否合法
     * @param {Array} list 存储日期列表
     * @param {Boolean} filter 是否过滤
     * @param {Boolean} format 是否格式化成 yyyyMMdd 的格式
     * @return filter ? 过滤后的数据 : 是否符合条件
     */
    validateSaveList (list, filter = false, format = false) {
        // validate
        if (!list || Object.prototype.toString.call(list) !== '[object Array]' || !list.length)
            return false
        let formatList = []
        let result = list.filter((item) => {
            let newDate = new Date(item)
            let isDate = Boolean(newDate && newDate.getFullYear()) // 是日期

            let isRight = Boolean(BingServices.getBingDayGap(newDate) !== false) // 是否满足
            let pass = Boolean(isDate && isRight)
            pass && format && formatList.push(utils.formatTime(newDate, 'yyyyMMdd')) // 如果要格式化，存储数据
            return pass
        })
        // filter返回集合，format确定返回格式化集合还是原集合
        return filter ? (format ? formatList : result) : Boolean(result.length > 0)
    }
}


class BingServices {
    constructor () {}

    /**
     * 每天存储bingImageStoryData
     * 获取当天日期，发送请求，查询是否存在
     *  - N 存入
     *  - Y 取消
     * @param {yyyyMMdd Date} date 图片日期
     * @param {Boolean} warning 查询接口失败时是否发送邮件 （内部调用）
     * bingStory接口会返回带水印的图片，先请求每日接口暂存地址
     */
    static async saveBingDaily ({date, warning} = '') {

        const _idx = date // 日期偏移量
        ? this.getBingDayGap(date)
        : 0

        if (_idx === false) {
            logger.error(`参数范围错误: ${date}`)
            logger.info('执行dailySave 终止')
            return
        }

        // 初始化请求参数 以及固定配置
        const bingToday = this.getBingDate(date), // bing图片日期格式, 并作为键 // @note todo or BingServices.getBingDate(date)
            bingImageUrl = this.getBingImageUrl({idx: _idx}),
            bingStoryUrl = this.getBingStoryUrl(bingToday),
            prefix = CONFIG.BING_IMAGE.PREFIX, // global dns
            defaultResolution = CONFIG.BING_IMAGE.DEFAULT_RESOLUTION // 默认分辨率

        // 缓存信息
        let imageNoWaterMark = null // 无水印地址
        let storyData = null // 缓存story数据
        let imageData = null // 缓存每日图片数据
        let originData = null // JSON 格式Story数据
        let canSave = false // 是否可以存储
        let task = 0 // 成功任务 1 查询图片 2 查询故事 3 存redis 4 存mongod 

        logger.info(`执行dailySave: ${bingToday} 开始`, bingImageUrl, bingStoryUrl)

        // 获取无水印图片
        await superagent.get(bingImageUrl).set('Content-type', 'application/json').then((res) => {
            if (res.status === 200 && res.body) {
                imageData = res.body.images[0]
                imageNoWaterMark = prefix + res.body.images[0].urlbase + '_' + defaultResolution + '.jpg'
                task += 1
                return
            }
            logger.error('请求bing图片接口未正常返回数据', bingImageUrl, res)
        }).catch((e) => {
            logger.error('请求bing图片查询接口失败', e)
            // 预警模式下 发送报错邮件
            warning && MailSercice.sendErrorReportMail('请求bing图片查询接口失败', e)
        })

        // 获取每日story数据
        await superagent.get(bingStoryUrl).set('Content-type', 'application/json').then((res) => {
            if (res.status === 200 && res.body) {
                let saveData = res.body
                saveData = Object.assign(imageData, saveData)
                saveData.id = bingToday
                // 添加之前保存的无水印图
                saveData.imageUrl = imageNoWaterMark
                
                originData = saveData
                storyData = JSON.stringify(saveData)
                task += 1
                logger.info('请求bing接口成功')
                return
            }
            logger.error('请求bing接口失败，返回', res.status)
        }).catch((e) => {
            logger.error('请求bing接口失败', e)
            // 预警模式下 发送报错邮件
            warning && MailSercice.sendErrorReportMail('请求bing图片查询接口失败', e)
        })

        // 检测是否可以存储数据
        storyData && await redisInstance.haveHashKey(BING_STORY_KEY, bingToday).then((res) => {
            logger.info('已存在bingStory, 流程结束', bingToday)
        }).catch((err) => {
            logger.info(`bingStory-${bingToday}-重复检测通过`)
            canSave = true
        })

        if (!canSave) {
            return
        }
        // 存储流程
        // 进行数据存储
        redisInstance.hashSet(BING_STORY_KEY, bingToday, storyData).then((res) => {
            logger.info(`Redis存储${bingToday}成功`)
        }).catch((err) => {
            logger.info(`Redis存储${bingToday}失败`, err)
            // 发送失败邮件
            MailSercice.sendErrorReportMail(`Redis存储${bingToday}失败`, err)
        })

        logger.info(`执行dailySave: ${bingToday} 完成, task: ${ task === 4 ? "success" : task }`)

        // 满足存储条件 确保不重复储存
        let mg_result = StoreService.saveToBingData(originData)
        if (mg_result.suc) {
            logger.info(`Mongod存储${bingToday}成功`)
        } else {
            logger.error(`Mongod存储${bingToday}失败`, mg_result.err)
            // 发送失败邮件
            MailSercice.sendErrorReportMail(`Mongod存储${bingToday}失败`, mg_result.err)
        }
    }


    /**
     * 批量存取数据到数据库中
     * @param {Array} listData 
     */
    static async saveListToDB (listData) {

        // TODO
        // 部分流程转到store-services中去
        //
        // 
        let {detail} = await redisInstance.hashGetAllValues(BING_STORY_KEY)
        let resultList = []

        if (!detail || detail.length === 0) return false


        detail.forEach((item, idx) => {
            try {
                resultList.push(JSON.parse(item))
            } catch (e) {
                logger.error('批量存储解析条目错误', item)
            }
        })

        resultList = resultList.sort((p, n) => { return Number(p.id) - Number(n.id) })

        const result = await StoreService.multiSave(resultList)
        
        return result
    }

    /**
     * 存储指定时间的daily
     * @param {Array} list 
     */
    static async saveBingDailyStack (list) {
        // validate && 筛选 && 格式化数据
        let filterList = helper.validateSaveList(list, true, false) // 列表，需要返回过滤后的数据，需要格式化
        if (filterList === false) {
            logger.error('保存列表service参数错误')
            throw('saveBingDailyList get a error arugments')
        }

        // 解决并行执行的问题，使用for
        for (let i = 0; i < filterList.length; i ++) {
            logger.info('--------------------start------------------------')
            await BingServices.saveBingDaily({date: filterList[i]})
            logger.info('----------------------end----------------------')
        }
    }

    /**
     * 获取当前7天的数据
     */
    static async saveWeeklyBingDaily () {
        let today = utils.getZoneDate(),
            year = today.getFullYear(),
            month = today.getMonth() + 1,
            day = today.getDate()
        today = new Date(year + '-' + month + '-' + day)

        logger.info('执行日期', utils.formatTime(new Date()))

        for (let i = 0; i < 8 ; i ++) {
            let timeGoesBy = today.getTime() - (1000 * 60 * 60 * 24) * i
            let date = new Date(timeGoesBy)
            logger.info('存储序列', utils.formatTime(date))
            await this.saveBingDaily({date})
        }
    }

    /**
     * 与bing日期相差的天数，如果时间超过limit 则返回false
     * const limit = gap >= -1 && gap <= 7
     * @param {date} day 
     * @return (gap >= -1 && gap <= 7) ? gap : false不满足
     */
    static getBingDayGap (day) {
        if (!day) return false

        day = new Date(day)
        if (!day.getFullYear()) return false
        let gap = utils.getDateGap(day, new Date())
        let accord = gap >= -1 && gap <= 7
        return accord ? gap : false
    }

    /**
     * 获取所有bing记录数据列表
     */
    static async getSaveList () {
        return redisInstance.hashGetAllValues(BING_STORY_KEY)
    }

    /**
     * 获取某条存储记录
     * @pramas {yyyMMdd} date 日期键
     */
    static async getRecordByDate (date) {
        return redisInstance.hashGet('bing_storys', date)
    }

    /**
     * 获取请求bing图片地址
     * @param {js || ''} format 返回数据格式 js(json) or null(default: xml)
     * @param {Number} idx 请求图片截至天数 0 today, -1 截至明天 1 截至昨天
     * @param {Number} n 请求数量 1-9
     * @param {String} mkt 地区
     * @return 格式化||默认 bing图片请求拼接地址
     */
    static getBingImageUrl ({format = 'js', idx = 0, n = 1, mkt = 'zh-CN'}) {
        let base = CONFIG.API.bingImageApi + '?format=:format&idx=:idx&n=:n&mkt=:mkt'
        let url = base
                    .replace(':format', format)
                    .replace(':idx', idx)
                    .replace(':n', n)
                    .replace(':mkt', mkt)
        return url
    }

    /**
     * 获取请求bing图片地址
     * @return 格式化 bing故事请求地址
     */
    static getBingStoryUrl (d) {
        return CONFIG.API.bingStoryApi + '?d=' + d
    }
    
    /**
     * 获取bing格式日期 yyyMMdd
     * @prams {Date} date 指定一个要转换日期
     * @return 指定转化日期或当天yyyyMMdd
     */
    static getBingDate (date) {
        let result = '0000000'
        if (!date) { // 优先判断不存在
            result = format(new Date())
        } else {
            if (/^\d{4}(0[1-9]|1[0-2])\d{2}$/.test(date)) {
                return date
            }
            try {
                result = format(new Date(date))
            } catch (e) {
                result = format(new Date())
            }
        }
        function format (date) {
            let year = date.getFullYear() + ''
            let month = date.getMonth() + 1
            month = month > 9 ? month + '' : '0' + month
            let day = date.getDate() + ''
            day = day > 9 ? day + '' : '0' + day
            return year + month + day
        }
        return result
    }

    static getFullList (data, sort) {
        let result = data.map((elm) => {
            try { elm = JSON.parse(elm) }
            catch(e) {}
            return elm
        })
        if (sort)
            result = result.sort((a, b) => { 
                return sort === '0' ?
                     Number(a.id) - Number(b.id) : 
                     Number(b.id) - Number(a.id)
            }) // id从小到大排序
        return result
    }

    static getPageList (data, pageNo, pageSize, sort) {
        data = data.map((item) => {
            try { item = JSON.parse(item) } catch(e) {}
            return item
        })
        data = data.sort((a, b) => { 
            return sort === '0' ?
                Number(a.id) - Number(b.id) : 
                Number(b.id) - Number(a.id)
        }) // id从小到大排序

        const start = (pageNo - 1) * pageSize
        const end = pageNo * pageSize

        return data.slice(start, end)
    }

    // static sort
}



module.exports.BingService = BingServices
module.exports.StoreService = StoreService