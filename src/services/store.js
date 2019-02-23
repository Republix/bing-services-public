/**
 * 存储服务 Redis + Mongodb
 * TODO
 * - Redis 存储代码迁移到此
 */

const Mongo = require('./mongo/mongodb')
const appLogger = require('../midware/log4j').app_logger // 仅调试使用

class StoreService {
    constructor () {
    }

    /**
     * Todo @param {Boolean} exist 允许重复
     * @param {*} data 要存储的数据
     */
    static async saveToBingData (data) {

        let result = { suc: false }

        await Mongo.bingModel.create(data).then((res) => {
            result = { suc: true }
        }).catch((err) => {
            result = { suc: false, err}
        })

        return result
    }

    static async multiSave (list) {

        const result = {}

        await Mongo.bingModel.insertMany(list).then((res) => {
            result.suc = true
            result.count = res ? res.length : 0
            appLogger.info('批量存储数据成功', `共存储${result.count}条`)
        }).catch((err) => {
            result.suc = false
            result.err = err
        })

        return result
    }



}

module.exports = StoreService
