const mongoose = require('mongoose')
const MONGO_AUTH_STR = require('../../config').MONGO_AUTH_STR
const sysLogger = require('../logs').system

const bingInstance = require("./bing-schema")
const collageImageInstance = require('./collage-schema')


mongoose.connect(decodeURIComponent(MONGO_AUTH_STR), { useNewUrlParser: true }).then(() => {
    sysLogger.info('<<mongo 连接成功>>')
}, (err) => {
    sysLogger.error('<<mongo 连接失败>>', err)
})

const Schema = mongoose.Schema

const bingSchema = new Schema(bingInstance.schema, bingInstance.extend)
const bingModel = mongoose.model(bingInstance.name, bingSchema, bingInstance.name)

const collageImageSchema = new Schema(collageImageInstance.schema, collageImageInstance.extend)
const collageImageModel = mongoose.model(collageImageInstance.name, collageImageSchema, collageImageInstance.name)

// module.exports = mongoose
module.exports = {
    bingModel,
    collageImageModel
}

// const mongoose = require('mongoose')
// const MONGO_AUTH_STR = require('../../config').MONGO_AUTH_STR

// const bingBaseData = require('.//bing-schema')

// const appLogger = require('../../services/logs').app

// class Mongod {

//     constructor () {    
//         this.bingModel = {}
//         this.initial.apply(this)
//     }

//     /**
//      * 绑定作用域到this实例下
//      */
//     async initial () {
//         let connSuc = false
//         await mongoose.connect(
//             decodeURIComponent(MONGO_AUTH_STR),
//             { useNewUrlParser: true }
//         ).then(
//             () => { 
//                 connSuc = true
//                 appLogger.info('连接Mongodb成功')
//             }, 
//             (err) => { 
//                 appLogger.warn('连接Mongodb失败', err)
//             }
//         )

//         connSuc && this.initialModel()
//     }


//     /**
//      * 设置bingModel
//      */
//     async initialModel () {
//         this.bingModel = mongoose.model(bingBaseData.TYPE, bingBaseData.schema)
//     }


// }


// module.exports = new Mongod()