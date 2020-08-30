
//Join command. Makes the bot join the given voice channel, or, if none given, the voice channel the user is in.

const utils = require('../utils.js');
const prefix = utils.config.prefix;

module.exports = {
    name: 'join',
    description: 'Makes the bot join the given voice channel, or, if none given, the voice channel the user is in.',
    alias: ['j', 'sum', 'summon'],
    args: false,
    useage: `\`${prefix}join <voice channel>\``,
    admin: false,
    botadmin: false,
    server: true,
    execute(params) {
        let log = global.log;
        if (params.args.length < 1) {
            const { voiceChannel } = params.msg.member;
            if (voiceChannel === params.bot.voiceChannel) return params.msg.reply(`I'm already in that voice channel...`);
            if (!voiceChannel && (!params.bot.dispatcher.playing || !params.bot.dispatcher)) {
                return params.msg.reply(`You're not in a voice channel and none were given...`);
            }
            joinVoice(voiceChannel, params.bot);
            return;
        }
        let chan = utils.findChanFromGuild(params.args.join(' '), params.bot.guild, 'voice');
        if (chan === params.bot.voiceChannel) return params.msg.reply(`I'm already in that voice channel...`);
        try { joinVoice(chan, params.bot); return; }
        catch { return params.msg.reply(`That channel doesn't exist or isn't a voice channel!`); }
    }
};

function joinVoice(voiceChannel, status) {
    voiceChannel.join().then(connection => {
        status.voiceConnection = connection
    });
    status.voiceChannel = voiceChannel;
};