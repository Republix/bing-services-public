const mongoose = require('mongoose')
const MONGO_AUTH_STR = require('../../config').MONGO_AUTH_STR

const bingBaseData = require('.//bing-schema')

const appLogger = require('../../midware/log4j').app_logger

class Mongod {

    constructor () {    
        this.bingModel = {}
        this.initial.apply(this)
    }

    /**
     * 绑定作用域到this实例下
     */
    async initial () {
        let connSuc = false
        await mongoose.connect(
            decodeURIComponent(MONGO_AUTH_STR),
            { useNewUrlParser: true }
        ).then(
            () => { 
                connSuc = true
                appLogger.info('连接Mongodb成功')
            }, 
            (err) => { 
                appLogger.warn('连接Mongodb失败', err)
            }
        )

        connSuc && this.initialModel()
    }


    /**
     * 设置bingModel
     */
    async initialModel () {
        this.bingModel = mongoose.model(bingBaseData.TYPE, bingBaseData.schema)
    }


}


module.exports = new Mongod()