const Router = require('koa-router'),
    controller = require('./controller')


const router = new Router({
    prefix: '/'
})

router
    .get('', controller.bingApiInfo)

    .get('api-info', controller.bingApiInfo)

    // 转发接口
    // bing-image 转发
    .get('bing-image', controller.bingImageProxy)
    // bing-iamge 转发
    .post('bing-image', controller.bingImageProxy)
    // bing-story 转发
    .get('bing-story', controller.bingStoryProxy)
    
    // 获取带有所有信息的bing数据列表
    .get('story-list', controller.bingStore)
    // 获取当天 或指定某一天的数据
    .get('today', controller.whichDay)
    
    // 特殊 接口
    .get('frog', controller.blackGlasses, controller.bullet)


    // 权限接口
    // 导入数据
    // .post('manage/import', managerCtrl.import)


module.exports = router