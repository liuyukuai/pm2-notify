const axios = require('axios');
const concat = require('lodash.concat');

class WeiChat {
    baseUrl = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=';

    constructor(options) {
        this.keys = options.keys.split(',');
    }

    async send(content) {
        const datas = [];
        const errors = [];
        for (let key of this.keys) {
            try {
                const data = await this.#sendMsg(key, content);
                datas.push(data.data);
            } catch (err) {
                errors.push(err.toString());
            }
        }
        return new Promise((resolve, reject) => {
            if (datas.length > 0) {
                resolve(concat([], errors, datas));
                return;
            }
            if (errors.length === this.keys.length) {
                reject(concat([], errors, datas));
            }
        });
    }

    async #sendMsg(key, content) {
        return axios.post(`${this.baseUrl}${key}`, {
            msgtype: 'markdown',
            markdown: {
                content
            }
        });
    }
}
exports.WeiChat = WeiChat;
