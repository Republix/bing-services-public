const Koa = require('koa'),
    bodyParser = require('koa-bodyparser'),
    CONFIG = require('./config'),
    router = require('./router'),
    path = require('path'),
    crossOrigin = require('koa2-origin-cors'),
    static = require('koa-static'),
    logger = require('./midware/log4j').middle,
    errorHandler = require('./midware/error').appErrorHandler,
    schedule = require('./services/schedule')


const app = new Koa()

app.use(logger())


app.use(crossOrigin(CONFIG.CORSS))

app.use(bodyParser())

app.use(router.routes()).use(router.allowedMethods())

app.use(static(path.join(__dirname, CONFIG.STATIC_PATH)))

app.use((ctx) => { ctx.throw(404) })

app.on('error', errorHandler)

app.listen(CONFIG.SYSTEM_PORT)

schedule.autoStart()
