const moment = require('moment');
const md5 = require('md5');
const sending = {};
// 当前模块的ID
const hostName = require('os').hostname();
const Utils = {

    getIp() {
        let interfaces = require("os").networkInterfaces();
        for (let devName in interfaces) {
            let iface = interfaces[devName];
            for (let i = 0; i < iface.length; i++) {
                let alias = iface[i];

                if (alias.family === "IPv4" && alias.address !== "127.0.0.1" && !alias.internal) {
                    return alias.address;
                }
            }
        }
    },
    // 获取时间
    getTime(time) {
        return moment(time).format('YYYY-MM-DD HH:mm:ss');
    },
    isSending(cPmId, info) {
        // 如果是当前监听程序进程，默认不发送信息
        return info.process.pm_id === cPmId || cPmId < 0;
    },
    getProcessMsg(info) {
        const msg = {};
        msg.host = hostName;
        msg.ip = this.getIp();
        msg.service = info.process.name;
        msg.pmId = info.process.pm_id;
        msg.time = this.getTime(info);
        msg.operator = info.event;
        msg.status = info.process.status;
        msg.createTime = info.process.created_at;
        msg.restartTime = info.process.restart_time;
        msg.pm_uptime = info.process.pm_uptime;
        msg.spanId = info.process.unique_id;
        msg.uptime = msg.pm_uptime - msg.createTime;
        return msg;
    },
    getLogMsg(info) {
        const msg = this.getProcessMsg(info);
        msg.msg = info.data
        return msg;
    }
    // 查询发送次数
    // getSendingCnt(data) {
    //     const digest = md5(data);
    //     if (sending[digest] === undefined) {
    //         sending[digest] = {count: 0, time: new Date().getTime()};
    //     } else {
    //         sending[digest].count += 1;
    //     }
    //     return sending[digest].count;
    // }
}
exports.Utils = Utils