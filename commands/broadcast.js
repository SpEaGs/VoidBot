
//Broadcast command. Sends a given message the default text channel of all servers the bot is in.

const utils = require('../utils.js');
const prefix = utils.config.prefix;

module.exports = {
    name: 'broadcast',
    description: 'Sends a given message to all servers the bot is in.',
    alias: [],
    args: true,
    usage: `\`${prefix}broadcast <message>\``,
    admin: false,
    botadmin: true,
    server: true,
    execute(params) {
        let client = params.bot.status.client;
        let toSend = params.args.join(' ')
        for (let bot of client.children.array()) {
            client.channels.get(bot.defaultTextChannel.id).sendMessage(`[BOT AUTHOR BROADCAST] ${toSend}`);
        }
    }
}