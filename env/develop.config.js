/**
 * 配置文件
 * 需要 Redis, Mongodb 支持
 */


// MONGODB配置
const MONGODB = {
    PORT: 27017,
    HOST: '127.0.0.1',
    DB_NAME: 'bing',
    USRE_NAME: 'user_name',
    CLEAR_KEY: 'pass_word*'
}

// Redis配置
const REDIS_CONFIG = {
    PORT: 6379,
    HOST: '127.0.0.1',
    PWD: 'redis_password',
    OPTIONS: {}
}

// 邮箱配置
const MAIL_DEFAULT_TRANSPORT = {
    host: 'smtp.qq.com',
    service: 'qq',
    port: 465,
    secure: true,
    secureConnection: true, // true: port = 465, false port = 587
    auth: {
        user: '1234567@qq.com',
        pass: '请到邮箱中设置密码，非账号密码'
    }
}

const CONFIG = {

    // 系统配置
    // MONGODB 连接字符串
    MONGO_AUTH_STR: `mongodb://${MONGODB.USRE_NAME}:${MONGODB.CLEAR_KEY}@${MONGODB.HOST}/${MONGODB.DB_NAME}`,
    // REDIS 配置
    REDIS_CONFIG,
    // 邮箱
    MAIL_DEFAULT_TRANSPORT,

    // 其他配置
    // 请求bing接口
    API: {
        // cn.bing 2019-0123 晚被blocked
        // https://www4.bing.com/ 暂时可使用
        bingImageApi: 'https://www.bing.com/HPImageArchive.aspx', // 每日图接口
        bingStoryApi: 'https://www.bing.com/cnhp/coverstory' // 每日故事接口 ?d= 20140501-today
    },

    // 系统端口号
    SYSTEM_PORT: 3010,

    // 静态资源文件夹目录
    STATIC_PATH: '../static',

    // 跨域模式配置参考 https://www.npmjs.com/package/koa2-origin-cors
    CORSS: {
        allowAll: true, // 允许所有
    },

    // 默认分辨率与base请求前缀
    BING_IMAGE: {
        DEFAULT_RESOLUTION: '1920x1080',
        PREFIX: 'https://www.bing.com'
    },



}



module.exports = CONFIG
