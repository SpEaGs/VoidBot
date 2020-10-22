
//WebUI command. Sends a link to the Bot's WebUI dashboard.

const utils = require('../utils.js');
const prefix = utils.config.prefix;
const pubIP = utils.config.pubIP;

module.exports = {
    name: 'webUI',
    description: 'Sends a link to the WebUI page.',
    alias: [],
    args: true,
    usage: `\`${prefix}webui\``,
    admin: false,
    botadmin: false,
    server: true,
    execute(params) {
        params.msg.reply(`The web UI can be found here: https://${pubIP}:7777/dash`);
    }
}