
//Pause command. Pauses the bot's current audio stream.

const utils = require('../utils.js');
const prefix = utils.config.prefix;

const MAIN = require('../main.js');

module.exports = {
    name: 'pause',
    description: 'Pauses the bot\'s currently playing audio stream.',
    alias: false,
    args: false,
    usage: `\`${prefix}pause\``,
    admin: false,
    botadmin: false,
    server: true,
    execute(params) {
        switch (params.bot.dispatcher.paused) {
            case false: {
                params.bot.dispatcher.pause()
                params.bot.guild.channels.cache.get(params.bot.defaultTextChannel.id).send(`Audio stream paused. Use \`${prefix}resume\` to resume.`);
                setTimeout(() => {MAIN.eSender.socket.emit('sendBotInfo', [utils.dumbifyBot(params.bot)])}, 1000);
                break;
            }
            case true: {
                params.bot.guild.channels.cache.get(params.bot.defaultTextChannel.id).send(`Audio stream is already paused. Use \`${prefix}resume\` to resume.`);
                break;
            }
        }
    },
};