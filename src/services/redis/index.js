const Redis = require('redis')
const {PORT, HOST, OPTIONS, PWD} = require('../../config').REDIS_CONFIG
const sysLogger = require('../logs').system

let RedisInstance = Redis.createClient({
    PORT,
    HOST,
    OPTIONS
})

RedisInstance.auth(PWD, (err) => {
    sysLogger.info(`<<Redis 验证${err ? '失败' : '成功'}>>`)
})

RedisInstance.on('connect', () => {
    sysLogger.info('<<Redis 连接中>>')
})

RedisInstance.on('error', (err) => {
    sysLogger.info('<<Redis 捕获错误>>', err)
})

RedisInstance.on('reconnection', () => {
    sysLogger.info('<<Redis 进行重新连接>>')
})

RedisInstance.on('end', () => {
    sysLogger.info('<<Redis 已经断开连接>>')
})

module.exports = RedisInstance
