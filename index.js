const pm2 = require('pm2')
const pmx = require('pmx')

pmx.initModule(
    // 配置
    {},
    // 函数
    function (err, conf) {
        if (err) {
            throw err;
        }
        // 当前模块的ID
        let cPmId = -1;
        // 查询当前进程
        pm2.list((err, list) => {
            if (err) throw err;
            for (let item of list) {
                if (item.name === conf.module_name) {
                    cPmId = item.pm_id;
                }
            }
        });

        pm2.launchBus(function (err, bus) {
            bus.on('*', function (packet) {
                console.log(packet)
            })
        });
    })