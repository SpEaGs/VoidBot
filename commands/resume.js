
//Resume command. Resumes the bot's current audio stream.

const utils = require('../utils.js');
const prefix = utils.config.prefix;

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
                params.msg.reply(`Audio stream resumed.`);
            }
            case false: {
                params.msg.reply(`Audio stream is already playing.`);
            }
        }
    },
};