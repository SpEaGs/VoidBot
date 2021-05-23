
//Playlist command. Lists all entries in the audio playlist.

const utils = require('../utils.js');
const prefix = utils.config.prefix;

let name = 'playlist'
let description = 'Lists all entries in audio playlist.'

module.exports = {
    name: name,
    description: description,
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
            return params.msg.reply("The playlist is empty.").catch(() => {
                return params.bot.guild.channels.cache.get(params.bot.defaultTextChannel.id).send(`${mem} The playlist is empty.`)
            });
        }
        for (const item of params.bot.audioQueue) {
            i += 1;
            output.push(`${i}) - \`${item.videoDetails.title} [${parseInt(item.videoDetails.lengthSeconds / 60)}:${(item.videoDetails.lengthSeconds % 60).toString().padStart(2, "0")}] (added by: ${item.added_by})\``);
        };
        return params.msg.reply(`Playlist: ${output.join('\n')}`).catch(() => {
            return params.bot.guild.channels.cache.get(params.bot.defaultTextChannel.id).send(`${mem} Playlist: ${output.join('\n')}`)
        });
    },
    regJSON: {
        name: name,
        description: description
    }
};