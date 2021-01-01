
//stop command. Ends the bot's active audio stream, paused or otherwise.

const utils = require('../utils.js');
const prefix = utils.config.prefix;

const MAIN = require('../main.js');

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
            MAIN.eSender.socket.emit('sendBotInfo', [utils.dumbifyBot(params.bot)]);
        }
        catch (error) {
            logErr(`Error stopping music:\n${error}`, '[STOP]');
        }
    },
};

function stopAudio(dispatcher, msg) {
    try {
        dispatcher.pause();
    }
    catch (error) {}
    msg.reply(`Audio stream ended.`);
}