const fs = require('fs')
const superagent = require('superagent')

class Service {

    constructor () {

    }

    /**
     * Todo Note
     * @param {String} url 请求下载文件地址
     * @param {*} param1 
     */
    static async download (url, {savePath, saveName, fullPath}) {
        console.log(url, savePath, saveName)

        return new Promise((resolve, reject) => {
            // func1 
            try {
                superagent
                .get(url)
                .pipe(fs.createWriteStream(fullPath || (savePath + saveName) ))
                .on('close', function () {
                    resolve({ suc: true })
                })
            } catch (e) {
                reject({ suc: false, error: e})
            }

            // func2 
            // let stream = fs.createWriteStream(savePath + saveName);
            // let req = superagent.get(url);
            // req.pipe(stream)
            // stream.on('close', function (e) {
            //     let r = fs.statSync(savePath + saveName)
            //     console.log(r)
            // }) 

        })
    }
}


module.exports = Service


