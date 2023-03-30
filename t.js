const pm2 = require('pm2');
const pmx = require('pmx');
const moment = require('moment');
const md5 = require('md5');

const { DingTalk } = require('./dingTalk');
const { WeiChat } = require('./weiChat');

const hostName = require('os').hostname();
const defaultThrottleTime = 5000;
let currentPmID = -1;
const sending = {};

pmx.initModule(
    {
        /** Options related to the display style on Keymetrics */
        widget: {
            /** Logo displayed */
            logo: 'https://app.keymetrics.io/img/logo/keymetrics-300.png',

            /**
             * Module colors
             * 0 = main element
             * 1 = secondary
             * 2 = main border
             * 3 = secondary border
             */
            theme: ['#141A1F', '#222222', '#3ff', '#3ff'],

            /** Section to show / hide */
            el: {
                probes: true,
                actions: true
            },

            /** Main block to show / hide */
            block: {
                actions: false,
                issues: true,
                meta: true,

                /** Custom metrics to put in BIG */
                main_probes: ['test-probe']
            }
        }
    },
    /**
     * @param {Error} err
     * @param {Object} conf
     */
    function (err, conf) {
        if (err) throw err;
        /** Get the current process PM ID */
        pm2.list(
            /**
             * @param {Error} err
             * @param {pm2.ProcessDescription[]} list
             */
            (err, list) => {
                if (err) throw err;
                for (let item of list) {
                    if (item.name == conf.module_name) {
                        currentPmID = item.pm_id;
                    }
                }
            }
        );
        pm2.launchBus((err, bus) => {
            /** If a startup error occurs, an error is thrown directly */
            if (err) throw err;

            const DingTalkSender = new DingTalk(conf);
            const WeiChatSender = new WeiChat(conf);

            bus.on('log:*', (type, info) => {
                /** If it is an error of the current process, it will not be processed, which may cause recursion */
                if (info.process.pm_id == currentPmID || currentPmID < 0) return;
                if (type !== 'err') return;

                /** Data collation */
                const dateTime = moment(info.at).format('YYYY-MM-DD HH:mm:ss');
                const sendTo = conf.sendTo.split(',').map((item) => {
                    return item.trim().toUpperCase();
                });
                const msgMd5 = md5(info.data);
                if (sending[msgMd5] === undefined) {
                    sending[msgMd5] = { count: 0, time: new Date().getTime() };
                } else {
                    sending[msgMd5].count += 1;
                }
                if (sending[msgMd5].count > 0) return;

                sendTo.forEach((item) => {
                    switch (item) {
                        case 'DINGTALK':
                            info.title = `#### **Server: ${hostName}**\n ##### **Sevice: ${info.process.name}**\n##### **PmId: ${info.process.pm_id}**\n##### **Time: ${dateTime}**  \n\n ##### **Error:** \n\n`;
                            info.msgTitle = `Error: N[${info.process.name}],P[${info.process.pm_id}],T[${dateTime}]`;
                            DingTalkSender.sendMarkDowns(info.msgTitle, info.title + '```' + info.data + '```')
                                .then((res) => {
                                    console.log(JSON.stringify(res));
                                })
                                .catch((err) => {
                                    console.log(JSON.stringify(err));
                                });
                            break;
                        case 'WEICHAT':
                            info.title = `**Server: ${hostName}**\n**Sevice: ${info.process.name}**\n**PmId: ${info.process.pm_id}**\n**Time: ${dateTime}**  \n\n`;
                            WeiChatSender.send(info.title + '<font color=\"comment\">' + info.data + '</font>')
                                .then((res) => {
                                    console.log(JSON.stringify(res));
                                })
                                .catch((err) => {
                                    console.log(JSON.stringify(err));
                                });
                            break;
                    }
                });
            });
        });
        /**
         * Ensure that the process is suspended, do not exit + throttle time processing
         */
        // setInterval(function () {
        //     for (key in sending) {
        //         const item = sending[key];
        //         const len = new Date().getTime() - item.time;
        //         if (item.count > 0 && len > (conf.throttleTime || defaultThrottleTime)) {
        //             delete sending[key];
        //         }
        //     }
        // }, 1000);
    }
);
