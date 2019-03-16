const Koa = require('koa'),
    bodyParser = require('koa-bodyparser'),
    CONFIG = require('./config'),
    router = require('./router'),
    static = require('./midware/static'),
    cors = require('./midware/cors'),   
    logger = require('./midware/log'),
    errorHandler = require('./midware/error').appErrorHandler,
    schedule = require('./services/schedule')


const app = new Koa()

app.use(logger())
// cors
app.use(cors())
// static dir
static.initial(app)

app.use(bodyParser())

app.use(router.routes()).use(router.allowedMethods())

app.on('error', errorHandler)

app.listen(CONFIG.SYSTEM_PORT)

schedule.autoStart()
