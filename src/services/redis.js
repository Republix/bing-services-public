const Redis = require('redis'),
    CONFIG = require('../config').REDIS_CONFIG,
    appLogger = require('../midware/log4j').app_logger

let count = 0

class RedisInstance {
    constructor () {
        appLogger.info('<<redis>> connect count', count += 1)
        this.client = Redis.createClient(CONFIG.PORT, CONFIG.HOST, CONFIG.OPTIONS)
        appLogger.info('connection to redis...')

        this.initialEventListener()
        this.setExtend()

        return this.instance
    }

    initialEventListener () {
        this.client.on('connect', () => {
            appLogger.info('<<redis>> 连接中')
        })
        
        this.client.auth(CONFIG.PWD, (res) => {
            appLogger.info('<<redis>> 验证成功')
        })
        
        this.client.on('error', (err) => {
            appLogger.info('<<redis>> Error: ', err)
        })
        this.client.on('reconnecting', () => {
            appLogger.info('<<redis>> 进行重新连接')
        })

        this.client.on('end', () => {
            appLogger.info('<<redis>> 已经断开连接')
        })
    }

    setExtend () {
        const client = this.client
        client.rcid = new Date().getTime()
        this.instance = {
            hashSet (mainKey, itemKey, value, expire) {
                return new Promise((resolve, reject) => {
                    client.hset(mainKey, itemKey, value, (err, doc) => {
                        if (err) {
                            reject({ message: 'hmset error', detail: err })
                            return
                        }
                        if (!isNaN(expire) && expire > 0) {
                            client.expire(mainKey, parseInt(expire))
                        }
                        resolve({ result: doc })
                    })
                })
            },
        
            hashGet (mainKey, itemKey) {
                return new Promise((resolve, reject) => {
                    client.hget(mainKey, itemKey, (err, doc) => {
                        if (err) {
                            reject({ verify: false, detail: err })
                            return
                        }
            
                        resolve({ verify: true, detail: doc })
                    })
                })
            },
        
            haveHashKey (mainKey, itemKey) {
                return new Promise((resolve, reject) => {
                    client.hmget(mainKey, itemKey, (err, doc) => {
                        if (err) {
                            reject({ verify: false, detail: err })
                            return
                        }
                        if (doc && doc[0]) {
                            resolve({ detail: doc, verify: true })
                            return
                        }
        
                        reject({ verify: false, detail: doc })
                    })
                })
            },
        
            hashGetAllValues (mainKey) {
                return new Promise((resolve, reject) => {
                    client.hvals(mainKey, (err, doc) => {
                    // client.hgetall(mainKey, (err, doc) => {
                        if (err) {
                            reject({ verify: false, detail: err })
                            return
                        }
                        resolve({ verify: true, detail: doc })
                    })
                })
            },

            rPush (mainKey, ...items) {
                return new Promise((resolve, reject) => {
                    client.rpush(mainKey, items, (err, doc) => {
                        if (err) {
                            reject({ verify: false, detail: err })
                            return
                        }
                        resolve({ verify: true, detail: doc })
                    })
                })
            }

        }
    }
}

module.exports.Instance = new RedisInstance