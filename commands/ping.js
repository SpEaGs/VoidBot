
//Ping command. Returns 'Pong!'

const utils = require('../utils.js');
const prefix = utils.config.prefix;

let name = 'ping'
let description = 'Ping!'

module.exports = {
    name: name,
    description: description,
    alias: false,
    args: false,
    usage: `\`${prefix}ping\``,
    admin: false,
    botadmin: false,
    server: false,
    execute(params) {
        params.msg.reply('Pong!');
    },
    regJSON: {
        name: name,
        description: description
    }
};