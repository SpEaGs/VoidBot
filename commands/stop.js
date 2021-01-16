
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
            stopAudio(params.bot);
            params.bot.dispatcher = false;
            params.bot.nowPlaying = false;
            MAIN.eSender.socket.emit('sendBotInfo', [utils.dumbifyBot(params.bot)]);
        }
        catch (error) {
            log(`Error stopping music:\n${error}`, ['[ERR]', '[STOP]']);
        }
    },
};

function stopAudio(bot) {
    try {
        bot.dispatcher.pause();
    }
    catch (error) {}
    bot.guild.channels.cache.get(bot.defaultTextChannel.id).send(`Audio stream ended.`);
}