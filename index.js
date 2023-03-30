const pm2 = require('pm2')
const pmx = require('pmx')
const {Utils} = require("./utils/utils");
const {WebChat} = require("./utils/webChat");
const sending = {};
pmx.initModule(
    // 配置
    {},
    // 函数
    function (err, options) {
        // 设置默认参数
        options.throttleTime = options.throttleTime || 5000;
        options.receives = options.receives || [];
        if (err) {
            throw err;
        }
        // 当前模块的ID
        let cPmId = -1;
        // 查询当前进程
        pm2.list((err, list) => {
            if (err) throw err;
            for (let item of list) {
                if (item.name === options.module_name) {
                    cPmId = item.pm_id;
                }
            }
        });
        const WebChatService = new WebChat(conf);
        pm2.launchBus(function (err, bus) {
            if (err) throw err;
            bus.on('process:*', function (type, info) {
                if (info.process.pm_id === cPmId || cPmId < 0) return;
                const processMsg = Utils.getProcessMsg(info);
                console.log(JSON.stringify(processMsg))
                WebChatService.send(processMsg);

            })
            bus.on('log:*', function (type, info) {
                if (info.process.pm_id === cPmId || cPmId < 0) return;
                if (type !== 'error') return;
                const errorMsg = Utils.getLogMsg(info);
                console.log(JSON.stringify(errorMsg))
                WebChatService.send(errorMsg);
            })
        });

        setInterval(function () {
            for (let key in sending) {
                const item = sending[key];
                const len = new Date().getTime() - item.time;
                if (item.count > 0 && len > options.throttleTime) {
                    delete sending[key];
                }
            }
        }, 1000);
    })