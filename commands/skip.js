
//stop command. Ends the bot's active audio stream, paused or otherwise.

const utils = require('../utils.js');
const prefix = utils.config.prefix;

module.exports = {
    name: 'skip',
    description: 'Skips the bot\'s currently playing audio stream.',
    alias: false,
    args: false,
    usage: `\`${prefix}skip\``,
    admin: false,
    botadmin: false,
    server: true,
    execute(params) {
        let log = global.log
        try {
            stopAudio(params.bot.dispatcher, params.msg);
        }
        catch (error) {
            log(error);
        }
    },
};

function stopAudio(dispatcher, msg) {
    dispatcher.end();
    msg.reply(`Skipping...`);
}