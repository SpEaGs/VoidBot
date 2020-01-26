
//Ping command. Returns 'Pong!'

const utils = require('../Utils.js');
const prefix = utils.config.prefix;

module.exports = {
    name: 'slap',
    description: 'Slap someone!',
    alias: false,
    args: true,
    usage: `\`${prefix}slap <thing to slap>\``,
    admin: false,
    botadmin: false,
    server: true,
    execute(params) {
        params.msg.reply(`I SLAP YOU, ${params.args[0]}, YOU INSOLENT FOOL!!!`);
    },
};