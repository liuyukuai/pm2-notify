const pm2 = require('pm2')

pm2.launchBus(function(err, pm2_bus) {
    pm2_bus.on('process:msg', function(packet) {
        console.log(packet)
    })
})