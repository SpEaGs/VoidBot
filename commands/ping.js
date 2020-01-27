
//Ping command. Returns 'Pong!'

const utils = require('../utils.js');
const prefix = utils.config.prefix;

module.exports = {
    name: 'ping',
    description: 'Ping!',
    alias: false,
    args: false,
    usage: `\`${prefix}ping\``,
    admin: false,
    botadmin: false,
    server: false,
    execute(params) {
        params.msg.reply('Pong!');
    },
};