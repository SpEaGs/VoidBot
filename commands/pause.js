
//Pause command. Pauses the bot's current audio stream.

const utils = require('../utils.js');
const prefix = utils.config.prefix;

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
                params.msg.reply(`Audio stream paused. Use \`${prefix}resume\` to resume.`);
                break;
            }
            case true: {
                params.msg.reply(`Audio stream is already paused. Use \`${prefix}resume\` to resume.`);
                break;
            }
        }
    },
};