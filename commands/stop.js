
//stop command. Ends the bot's active audio stream, paused or otherwise.

const utils = require('../utils.js');
const prefix = utils.config.prefix;

module.exports = {
    name: 'stop',
    description: 'Stops the bot\'s currently playing audio stream.',
    alias: false,
    args: false,
    usage: `\`${prefix}stop\``,
    admin: false,
    botadmin: false,
    server: true,
    execute(params) {
        let log = global.log
        try {
            params.bot.audioQueue = [];
            stopAudio(params.bot.dispatcher, params.msg);
            params.bot.dispatcher = false;
            params.bot.nowPlaying = false;
        }
        catch (error) {
            log(error);
        }
    },
};

function stopAudio(dispatcher, msg) {
    dispatcher.pause();
    msg.reply(`Audio stream ended.`);
}