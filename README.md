## 一个图片微服务
### 提供Bing图片自动收集 & 接口代理

> Features
>
> - 定时收集每日bing图片与对应故事信息
> - 提供收集壁纸库查询
> - 默认开启允许跨域，支持bing 图片/故事接口的请求转发
> - 支持邮件预警，收集信息或存储信息失败时发送警告邮件

##### 预览 & 接口说明
[api.republix.cn/bing](https://api.republix.cn/bing)

[bing.republix.cn](https://bing.republix.cn/)

[api-info](./static/api-info.json)

[效果demo](https://image.republix.cn)

<br/>

需要环境
- Redis
- Mongodb
- Nodejs
环境配置在src.

#### 初始化项目
```javascript
    yarn (or npm install)
```

开发与线上
```javascript
    yarn run dev // 开发 development
    yarn run online // 线上 product
```


#### 默认定时器服务
- 每天收集Bing图片数据
- 每周一次邮件报告

目录说明
```javascript
|--/env // 环境配置信息
|--|--/develop.config.js  // 开发环境配置文件
|--|--/prod.config.js // 线上环境配置文件
|--|--/deafult.config.js // 未指定环境默认配置文件

|--/static // 静态资源文件夹
|--/--/api-info.json // 接口说明

|--/src // code
|--|--/common // 公共模块 (utils工具类)
|--|--/midware // 中间件
|--|--/services // 服务层
|--|--|--/mongo // mongodb相关服务
|--|--|--services.js // 主服务
|--|--|--mail.js // 邮件相关服务
|--|--|--redis.js // redis服务与封装
|--|--|--schedule.js // 主计划服务
|--|--|--store.js // 普通Service与数据存储中间层
|--|--app.js // 项目入口
|--|--router.js // 主路由
|--|--controller.js // 主controller
|--|--config.js // 配置文件入口
```


#### 跨域设置
参考yarn add [koa2-origin-cors](https://www.npmjs.com/package/koa2-origin-cors)


