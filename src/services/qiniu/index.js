const qiniu = require('qiniu')
const fs = require('fs')
const Config = require('../../../env/qiniu.json')


const accessKey = Config.auth.access_key
const secretKey = Config.auth.secret_key


let options = {
    scope: 'qny-dns-443',
}
let putPolicy = new qiniu.rs.PutPolicy(options);
const mac = new qiniu.auth.digest.Mac(accessKey, secretKey)
const uploadToken = putPolicy.uploadToken(mac)
const config = new qiniu.conf.Config();
config.zone = qiniu.zone.Zone_z0

const service = {
    upload (filePath, saveFileName) {        

        let localFile = filePath
        let formUploader = new qiniu.form_up.FormUploader(config)
        let putExtra = new qiniu.form_up.PutExtra()
        let key = saveFileName
        // 文件上传
        return new Promise((resolve, reject) => {
            formUploader.putFile(uploadToken, key, localFile, putExtra, function(respErr, respBody, respInfo) {
                if (respErr) {
                    reject(respErr)
                    // throw respErr
                }
                if (respInfo.statusCode == 200) {
                    resolve(true)
                } else {
                    reject({
                        code: respInfo.statusCode,
                        body: respBody
                    })
                }
            })
        })

    }
}


module.exports = service

