
//Playlist command. Lists all entries in the audio playlist.

const utils = require('../utils.js');
const prefix = utils.config.prefix;

module.exports = {
    name: 'playlist',
    description: 'Lists all entries in audio playlist.',
    alias: ['pl'],
    args: false,
    usage: `\`${prefix}playlist\``,
    admin: false,
    botadmin: false,
    server: true,
    execute(params) {
        var output = []
        var i = 0;
        if (params.bot.audioQueue.length == 0) {
            return params.msg.reply("The playlist is empty.")
        }
        for (const item of params.bot.audioQueue) {
            i += 1;
            output.push(`${i}) - \`${item.title} [${parseInt(item.lengthSeconds / 60)}:${(item.lengthSeconds % 60).toString().padStart(2, "0")}] (added by: ${item.added_by})\``);
        };
        params.msg.reply(`Playlist: ${output.join('\n')}`);
    }
};