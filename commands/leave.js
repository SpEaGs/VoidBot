
//Leave command. Makes the bot stop playing audio, clear any queued songs, and leave whatever voice channel it's connected to.

const utils = require('../utils.js');
const prefix = utils.config.prefix;

const MAIN = require('../main.js');

module.exports = {
    name: 'leave',
    description: `Makes the bot stop playing audio, clear any queued songs, and leave whatever voice channel it's connected to.`,
    alias: ['l'],
    args: false,
    useage: `\`${prefix}leave\``,
    admin: false,
    botadmin: false,
    server: true,
    execute(params) {
        if (!params.bot.voiceChannel) return params.bot.guild.channels.cache.get(params.bot.defaultTextChannel.id).send(`I'm not in a voice channel...`);
        params.bot.audioQueue = [];
        if (params.bot.dispatcher !== false) {
            params.bot.dispatcher.end();
            params.bot.dispatcher = false;
        }
        params.bot.voiceChannel.leave();
        params.bot.voiceChannel = false;
        params.bot.voiceConnection = false;
        MAIN.eSender.socket.emit('sendBotInfo', [utils.dumbifyBot(params.bot)]);
    }
}