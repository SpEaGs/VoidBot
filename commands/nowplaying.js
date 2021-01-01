
//Now Playing command. Lists info about the currently playing audio.

const utils = require('../utils.js');
const prefix = utils.config.prefix;

module.exports = {
    name: 'nowplaying',
    description: 'Lists info about the currently playing audio.',
    alias: ['np'],
    args: false,
    usage: `\`${prefix}nowplaying\``,
    admin: false,
    botadmin: false,
    server: true,
    execute(params) {
        const nP = params.bot.nowPlaying;
        if (!params.bot.nowPlaying) {
            return params.msg.reply("I'm not playing anything you scrub!")
        }
        params.msg.reply(`Now Playing: \`${nP.videoDetails.title} [${parseInt(nP.videoDetails.lengthSeconds / 60)}:${(nP.videoDetails.lengthSeconds % 60).toString().padStart(2, "0")}}] (added by: ${nP.added_by})\`\nURL: ${nP.url}`);
    },
};