/**
 * 存储服务, 支持同步化
 * - Mongod
 * - Redis
 * 
 */

const redis = require('./redis/index')
const {bingModel, collageImageModel} = require('./mongo/mongodb')

const MongoModel = {
    bingModel,
    collageImageModel
}


const RedisStore = {
    select (idx) {
        return new Promise((resolve, reject) => {
            redis.select(idx, (err) => {
                if (err) {
                    reject({ suc: false, err })
                    return
                }
                resolve({ suc: true })
            })
        })
    },
    set (key, value, expire) {
        return new Promise((resolve, reject) => {
            redis.set(key, value, (err, doc) => {
                if (err) {
                    reject({ suc: false, err })
                    return
                }
                if (!isNaN(expire) && expire > 0) {
                    clientInformation.expire(key, value)
                }
                resolve({ suc: true })
            })
        })
    },
    get (key) {
        return new Promise((resolve, reject) => {
            redis.get(key, (err, doc) => {
                if (err) {
                    reject({ suc: false, err })
                    return
                }
                resolve({ suc: true, doc })
            })
        })
    },
    hset (mKey, iKey, value, expire) {
        return new Promise((resolve, reject) => {
            redis.hset(mKey, iKey, value, (err, doc) => {
                if (err) {
                    reject({ suc: false, err })
                    return
                }
                if (!isNaN(expire) && expire > 0) {
                    client.expire(mKey, parseInt(expire))
                }
                resolve({ suc: true })
            })
        })
    },
    hget (mKey, iKey) {
        return new Promise((resolve, reject) => {
            redis.hget(mKey, iKey, (err, doc) => {
                if (err) {
                    reject({ suc: false, err })
                    return
                }
                resolve({ suc: true, doc })
            })
        })
    },
    hmget (mKey, iKey) {
        return new Promise((resolve, reject) => {
            redis.hmget(mKey, iKey, (err, doc) => {
                if (err) {
                    reject({ suc: false, err })
                    return
                }
                resolve({ suc: false, doc })
            })
        })
    },
    hvals (key) {
        return new Promise((resolve, reject) => {
            redis.hvals(key, (err, doc) => {
                if (err) {
                    reject({ suc: false, err })
                    return
                }
                resolve({ suc: true, doc })
            })
        })
    },
    rpush (key, ...items) {
        return new Promise((resolve, reject) => {
            redis.rpush(key, items, (err, doc) => {
                if (err) {
                    reject({ suc: false, err })
                    return
                }
                resolve({ suc: true, doc })
            })
        })
    }

}


// module.exports = StoreService
module.exports = {
    RedisStore,
    MongoModel
}



// const Mongo = require('./mongo/mongodb')
// const appLogger = require('../services/logs').app

// class StoreService {
//     constructor () {
//     }
    
//     /**
//      * Todo @param {Boolean} exist 允许重复
//      * @param {*} data 要存储的数据
//      */
//     static async saveToBingData (data) {

//         let result = { suc: false }

//         await Mongo.bingModel.create(data).then((res) => {
//             result = { suc: true }
//         }).catch((err) => {
//             result = { suc: false, err}
//         })

//         return result
//     }

//     static async multiSave (list) {

//         const result = {}

//         await Mongo.bingModel.insertMany(list).then((res) => {
//             result.suc = true
//             result.count = res ? res.length : 0
//             appLogger.info('批量存储数据成功', `共存储${result.count}条`)
//         }).catch((err) => {
//             result.suc = false
//             result.err = err
//         })

//         return result
//     }

    

// }

// // module.exports = StoreService
// module.exports = StoreService
