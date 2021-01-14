
//stop command. Ends the bot's active audio stream, paused or otherwise.

const utils = require('../utils.js');
const play = require('./play.js');
const prefix = utils.config.prefix;

const MAIN = require('../main.js');

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
            stopAudio(params.bot.dispatcher, params.bot);
            params.bot.dispatcher = false;
            params.bot.nowPlaying = false;
            if (params.bot.audioQueue.length != 0) play.playNextInQueue(params.bot);
            MAIN.eSender.socket.emit('sendBotInfo', [utils.dumbifyBot(params.bot)]);
        }
        catch (error) {
            logErr(`Error skipping song:\n${error}`, '[SKIP]');
        }
    },
};

function stopAudio(dispatcher, bot) {
    dispatcher.pause();
    bot.guild.channels.cache.get(bot.defaultTextChannel.id).send(`Skipping...`);
}