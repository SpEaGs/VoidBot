
//Resume command. Resumes the bot's current audio stream.

const utils = require('../utils.js');
const prefix = utils.config.prefix;

const MAIN = require('../main.js');

module.exports = {
    name: 'resume',
    description: 'Resumes the bot\'s current audio stream.',
    alias: false,
    args: false,
    usage: `\`${prefix}resume\``,
    admin: false,
    botadmin: false,
    server: true,
    execute(params) {
        switch (params.bot.dispatcher.paused) {
            case true: {
                params.bot.dispatcher.resume()
                params.bot.guild.channels.cache.get(params.bot.defaultTextChannel.id).send(`Audio stream resumed.`);
                MAIN.eSender.socket.emit('sendBotInfo', [utils.dumbifyBot(params.bot)]);
                break;
            }
            case false: {
                params.bot.guild.channels.cache.get(params.bot.defaultTextChannel.id).send(`Audio stream is already playing.`);
                break;
            }
        }
    },
    regJSON: {
        name: this.name,
        description: this.description
    }
};