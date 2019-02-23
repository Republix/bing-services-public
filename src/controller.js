const superagent = require('superagent'),
    CONFIG = require('./config'),
    utils = require('./common/utils'),
    logger = require('./midware/log4j').middle_logger,
    BingService = require('./services/services').BingService,
    redisInstance = require('./services/redis').Instance,
    API_INFO_JSON = require('../static/api-info.json')

let ApiInfo = {}

try {
    ApiInfo = JSON.stringify(API_INFO_JSON)
} catch (e) {
    logger.error('解析api-info文件失败')
}


const helper = {
    
    /**
     * 
     * @param {Date} date yyyyMMdd
     */
    getBingStoryUrl (date) {
        let base = CONFIG.API.bingStoryApi + '?d=:date'
        let url = base
                .replace(':date', date)
        return url
    },

    /**
     * 获取数据成功时数据格式化
     * @param {Array} data
     * @param {1920|1368} w 
     * todo
     */
    formatImageList (data, w) {
        data.suc = true
        
        const regList = {
            '1366': { reg: /_1920x1080\./, res: '_1366x768.' }
        }
        data = data.images.map((img) => {
            if (w && regList[w]) {
                let target = regList[w]
                img.url = img.url.replace(target.reg, target.res)
            }
            return img
        })

        return JSON.stringify(data)
    }
}

module.exports = {

    /**
     * 返回接口说明
     */
    index: async (ctx) => {
        ctx.body = ApiInfo
    },

    /**
     * 代理请求Bing图片
     */
    bingImageProxy: async (ctx, next) => {
        
        let ctx_data = ctx.method === 'GET' ? ctx.request.query : ctx.request.body

        let queryInfo = { // 
            format: ctx_data.format,
            idx: ctx_data.idx,
            n: ctx_data.n,
            mkt: ctx_data.mkt
        }
        
        let imageWidth = ctx_data.w || null
        
        let url = BingService.getBingImageUrl(queryInfo)

        logger.info('请求Bing图片接口: ' + url)
        await superagent.get(url).set('Content-type', 'application/json')
            .then(res => {
                if (res.status !== 200 || !res.body) {
                    ctx.body = JSON.stringify({ suc: false, msg: `${res.status}` })
                } else {
                    ctx.body = helper.formatImageList(res.body, imageWidth)
                }
            })
            .catch((e) => {
                // ctx.throw(500, e)
                logger.error('请求bing图片接口', e)
                ctx.body = JSON.stringify({ suc: false, msg: 'connect to bing image api failed' })
            })
        
    },

    /**
     * 获取必应故事ctrl
     */
    bingStoryProxy: async (ctx, next) => {
        
        let query_date = utils.getParameterByName(ctx.request.url, 'd')
        // validate params
        if (!query_date && query_date !== 0) {
            ctx.body = JSON.stringify({ suc: false, msg: 'need date', data: query_date })
            return
        }
        // validate date
        let bingReg = /.*\d{8}.*/ // bing接口对格式要求比较宽松
        if (!bingReg.test(query_date)) {
            ctx.body = JSON.stringify({ suc: false, msg: 'valida date type', data: query_date })
            return
        }

        let url = BingService.getBingStoryUrl(query_date)

        logger.info('request bingStory', url)
        await superagent.post(url).set('Content-type', 'application/json')
            .then((res) => {
                if (res.status !== 200 || !res.body) {
                    ctx.body = JSON.stringify({ suc: false, msg: `${res.status}` })
                } else {
                    res.body.suc = true
                    ctx.body = JSON.stringify(res.body)
                }

            })
            .catch((e) => {
                ctx.body = JSON.stringify({ suc: false, msg: 'connect to bing story api failed' })
                logger.error('bingStoryCtl request', e)
            })
    },


    /**
     * 返回当天数据或指定日期数据
     * bing image+story
     */
    whichDay: async (ctx, next) => {
        const day = ctx.request.query.d
        const bingToday = BingService.getBingDate(day)

        await redisInstance.hashGet('bing_storys', bingToday).then((res) => {
            if (res.verify && res.detail) {
                res.detail.success = true
                ctx.body = res.detail
            } else {
                ctx.body = JSON.stringify({ msg: 'no data', success: false })
                BingService.saveBingDaily()
            }
        }).catch((err) => {
            ctx.body = JSON.stringify({ msg: 'server error', success: false })
            logger.error(err)
        })
    },

    /**
     * 返回存储的bing数据（image+story)
     */
    bingStore: async (ctx, next) => {
        
        const ctx_data = ctx.method === 'GET' ? ctx.request.query : ctx.request.body,
              pageNo = Math.max(1, Number(ctx_data.pageNo)) || null,
              pageSize = Math.max(1, Number(ctx_data.pageSize)) || null,
              sort = ctx_data.sort || false

        await redisInstance.hashGetAllValues('bing_storys').then((res) => {
            let result = res.detail || []

            if (pageNo && pageSize) {
                result = BingService.getPageList(result, pageNo, pageSize, sort)
            } else {
                result = BingService.getFullList(result, sort)
            }

            ctx.body = JSON.stringify(result)
        }).catch((err) => {
            ctx.body = JSON.stringify({ suc: false, msg: 'get list failed' })
            logger.error('get save list', err)
        })
    },

    
    bullet: async (ctx) => {
        // Todo 
        let ip = ctx.request.ip
        let uesrAgent = ctx.request.header && ctx.request.header['user-agent']
        let reqTiming = utils.formatTime(new Date(), `yyyy-MM-dd hh:mm:ss:S`)
    
        saveInfo = {
            uesrAgent,
            ip,
            reqTiming
        }

        logger.mark(`some one disappeared ${ctx.request.ip} ${uesrAgent}`)
        // redisInstance.hashSet(
        redisInstance.rPush(
            'sp_visit_info', 
            JSON.stringify(saveInfo)
        ).then(() => {},
        ).catch((e) => {
            logger.error('Redis存<userAgent>失败', e)
        })   
    },

    // 与功能无关
    blackGlasses: async (ctx, next) => {
        ctx.body = `
            <h1 style="font-size: 10em; text-align: center;">👓🐸</h1>
            <script>
                console.info('If you see the black glasses, you wil')
            </script>
        `
        next()
    }

}