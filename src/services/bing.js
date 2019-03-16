/**
 * image主service
 */

const superagent = require('superagent'),
    CONFIG = require('../config'),
    logger = require('./logs').app,
    path = require('path'),
    utils = require('../common/utils')

const StoreService = require('./store')
const mailService = require('./mail')
const QiniuService = require('./qiniu')
const DownLoadService = require('./download')
const { RedisStore, MongoModel: { bingModel } } = StoreService

const BING_STORY_KEY = 'bing_storys'
const QINIU_DOMAIN = 'https://qd.republix.cn'
const SAVE_IMAGE_PATH = '/bing-resource/'

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
    },

}

/**
 * TODO
 * logger 为detailSave单独出一个cataloge
 */
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
            bingImageRequestUrl = this.getBingImageRequestUrl({idx: _idx}),
            bingStoryRequestUrl = this.getBingStoryRequestUrl(bingToday),
            prefix = CONFIG.BING_IMAGE.PREFIX, // global dns
            defaultResolution = CONFIG.BING_IMAGE.DEFAULT_RESOLUTION // 默认分辨率

        // 缓存信息
        let imageData = null // 缓存每日图片数据
        let saveInfo = {} // 存储结果

        logger.info(`执行dailySave: ${bingToday} 开始`, bingImageRequestUrl, bingStoryRequestUrl)
        
        // step 1
        // 获取原图
        const requestImgResult = await this.requestBingImage(bingImageRequestUrl)

        if (requestImgResult.suc) {
            const _imageResult = requestImgResult.data
            imageData = _imageResult
            imageData.id = bingToday
            imageData.imageUrl = prefix + imageData.urlbase + '_' + defaultResolution + '.jpg'
            saveInfo.image = true
            logger.info('dailySave请求bing图片成功')
        } else {
            logger.error('请求bing图片查询接口失败, 终止流程', requestImgResult.error)
            warning && mailService.sendErrorReportMail('请求bing图片查询接口失败', requestImgResult.error)
            // 终止
            return 
        }

        // step 2
        // 获取story数据
        const requestStoryResult = await this.requestBingStory(bingStoryRequestUrl)

        if (requestStoryResult.suc) {
            imageData = Object.assign(imageData, requestImgResult.data)
            saveInfo.story = true
            logger.info('detailSave请求bing图片接口成功')
        } else {
            imageData = Object.assign(imageData, { story: 'no story data' })
            logger.error('请求bing故事接口失败', requestStoryResult.error)
            // 0301 开始 接口不再提供数据，邮件屏蔽
            // warning && mailService.sendErrorReportMail('请求bing图片查询接口失败', requestStoryResult.error)
        }

        // QiniuService.upload()

        // step 3 
        // 数据查重 
        try {
            let { doc } = await RedisStore.hget(BING_STORY_KEY, bingToday)
            if (doc) { // 有数据
                logger.error(`detailSave Redis查重：检测到重复值 ${bingToday}`)
                return 
            }
            logger.info(`detailSave Redis查重通过`)
        } catch (e) {
            logger.error(`detailSave Redis查重出错`, e)
        }

        // ------------- dev start --------------        
        // 下载到本地 然后上传到七牛云
        const saveFileName = `bing-${bingToday}.jpg`
        const saveFilePath = path.join(process.cwd(), SAVE_IMAGE_PATH)
        let download = {}

        try {
            download = await DownLoadService.download(imageData.imageUrl, {
                savePath: saveFilePath,
                saveName: saveFileName
            })
            logger.info('detailSave 下载图片到本地成功')
        } catch(e) {
            download = e
            logger.error('detailSave 下载图片到本地失败', download.error)
        }

        if (download.suc) {
            try {
                await QiniuService.upload(saveFilePath + saveFileName, saveFileName)

                imageData.cdn = QINIU_DOMAIN + '/' + saveFileName

                logger.info('detailSave 上传到七牛云成功')
            } catch (e) {
                logger.error('detailSave 上传到七牛云失败', e)
                mailService.sendErrorReportMail('detailSave 上传到七牛云失败', e)
            }
        } else {
            logger.error('detailSave 存储到本地失败', download.error)
        }
        // ------------- dev end ----------------

        // step 4 存 redis
        // 存储流程
        // 进行数据存储
        await RedisStore.hset(BING_STORY_KEY, bingToday, JSON.stringify(imageData)).then((res) => {
            logger.info(`Redis存储${bingToday}成功`)
            saveInfo.redis = true
        }).catch((err) => {
            logger.error(`Redis存储${bingToday}失败`, err)
            mailService.sendErrorReportMail(`Redis存储${bingToday}失败`, err)
        })

        // step 5 存 mongod
        // 满足存储条件 确保不重复储存
        try {
            let _result = await bingModel.findOne({ id: bingToday })
            if (_result !== null) {
                logger.info('detailSave Mongod 查重： 重复值', bingToday)
                return
            }
        } catch (e) {
            logger.error(`detailSave ${bingToday} Mongod 查重出错`, e)
        }

        try {
            await bingModel.create(imageData)
            saveInfo.mongod = true
            logger.info(`detailSave ${bingToday} Mongod 存储成功`)
        } catch (e) {
            logger.error(`detailSave ${bingToday} Mongod 存储出错`, e)
            mailService.sendErrorReportMail(`Mongod存储${bingToday}失败`, e)
        }

        logger.info(`detailSave ${bingToday} 流程完成 ${JSON.stringify(saveInfo)}`)
    }

    static async requestBingImage (url) {
        try {
            let result = await superagent.get(url).set('Content-type', 'application/json')
            if (result.status === 200 && result.body && result.body.images && result.body.images[0]) {
                let data = result.body.images[0]
                return { suc: true, data }
            } else {
                return { suc: false, error: '数据不完整' }
            }
        } catch (error) {
            return { suc: false, error }
        }
    }

    static async requestBingStory (url) {
        try {
            let {status, body} = await superagent.get(url).set('Content-type', 'application/json')
            if (status === 200 && body) {
                return { suc: true, data: body }
            } else {
                return { suc: false, error: `解析返回数据失败 status: ${status} body: ${body}`}
            }
        } catch (error) {
            return { suc: false, error }
        }
    }

    /**
     * 权限方法，存所有数据到mongod
     */
    static async saveAllDataToDB () {
        // 
        let {detail} = await RedisStore.hvals(BING_STORY_KEY)
        let resultList = []

        if (!detail || detail.length === 0) return false

        detail.forEach((item) => {
            try {
                resultList.push(JSON.parse(item))
            } catch (e) {
                logger.error('批量存储解析条目错误', item)
            }
        })

        resultList = resultList.sort((p, n) => { return Number(p.id) - Number(n.id) })

        try {
            const {count} = await bingModel.insertMany(resultList)
            logger.info('批量存储数据成功', `共存储${count}条`)
        } catch (e) {
            logger.info('批量存储数据失败', e)
        }   
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
        return RedisStore.hvals(BING_STORY_KEY)
    }

    /**
     * 获取某条存储记录
     * @pramas {yyyMMdd} date 日期键
     */
    static async getRecordByDate (date) {
        return RedisStore.hget('bing_storys', date)
    }

    /**
     * 获取请求bing图片地址
     * @param {js || ''} format 返回数据格式 js(json) or null(default: xml)
     * @param {Number} idx 请求图片时间偏移天数 0 today, -1 明天 1 截至昨天
     * @param {Number} n 请求数量 1-9
     * @param {String} mkt 地区
     * @return 格式化||默认 bing图片请求拼接地址
     */
    static getBingImageRequestUrl ({format = 'js', idx = 0, n = 1, mkt = 'zh-CN'}) {
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
    static getBingStoryRequestUrl (d) {
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



module.exports = BingServices