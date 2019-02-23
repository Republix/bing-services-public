let getZoneTime = function (date, timezone) {
    let offset = date.getTimezoneOffset() * 60 * 1000 // 单位为分钟的时间差
    return new Date(date + offset + timezone * 60 * 60 * 1000)
}

let getZoneDate = function (date = new Date(), timezone = 8) {
    let offset = date.getTimezoneOffset() * 60 * 1000
    return new Date(date.getTime() + offset + timezone * 60 * 60 * 1000)    
}

let formatTime = function (date, fmt) { // meizz
    let o = {
        "M+": date.getMonth() + 1, //月份
        "d+": date.getDate(), //日
        "h+": date.getHours(), //小时
        "m+": date.getMinutes(), //分
        "s+": date.getSeconds(), //秒
        "q+": Math.floor((date.getMonth() + 3) / 3), //季度
        "S": date.getMilliseconds() //毫秒
    }
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length))
    for (let k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)))
    return fmt
}


module.exports = {
    /**
     * 解析URL参数
     * @param {URL} url 
     * @param {String} name 
     * @return URL.params[name]
     */
    getParameterByName (url, name) {
        if (!url || !name) return ""

        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]")
        let reg = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            result = reg.exec(url)
        return result === null ? "" : decodeURIComponent(result[1]) 
    },

    /**
     * 获取当前时区时间（默认东八区）
     * @param {Number} timezone 时区
     * @return {Date} 指定时区时间
     */
    getZoneTime (date, timezone = 8) {
        return getZoneTime(date, timezone)
    },

    getZoneDate () {
        return getZoneDate(new Date(), 8)
    },

    /**
     * 格式化控制台输出时间
     * @param {Date} date 时间
     * @param {Number} zonetime 时区
     */
    formatTime (date, fmt = 'yyyy-MM-dd hh:mm:ss', zonetime = 8) {
        let now = getZoneTime(date, zonetime)
        return formatTime(date, fmt)
    },

    /**
     * 获取两个日期的时间差
     * @param {Date} day1 
     * @param {Date} day2 
     * @return day2 - day1 得到的天数差距(精确到day)
     */
    getDateGap (day1, day2) {
        let gap = day2.getTime() - day1.getTime()
        return parseInt(gap / (1000 * 60 * 60 * 24))
    },




}
