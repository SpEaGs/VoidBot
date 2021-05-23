
//WebUI command. Sends a link to the Bot's WebUI dashboard.

const utils = require('../utils.js');
const prefix = utils.config.prefix;
const pubIP = utils.config.pubIP;

let name = 'webui'
let description = 'Sends a link to the WebUI page.'

module.exports = {
    name: name,
    description: description,
    alias: [],
    args: false,
    usage: `\`${prefix}webui\``,
    admin: false,
    botadmin: false,
    server: true,
    execute(params) {
        params.msg.reply(`The web UI can be found here: http://${pubIP}:7777/dash`);
    },
    regJSON: {
        name: name,
        description: description
    }
}