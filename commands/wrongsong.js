
//Wrongsong command. Used to remove a song from the queue.

const utils = require('../utils.js');
const prefix = utils.config.prefix;

const MAIN = require('../main.js');

module.exports = {
    name: 'wrongsong',
    description: 'Removes a song from the queue.',
    alias: ['ws'],
    args: false,
    usage: `\`${prefix}wrongsong <number/np>\``,
    admin: false,
    botadmin: false,
    server: true,
    execute(params) {
        let item = parseInt(params.args)
        if (!params.args.length) {
            return params.bot.guild.channels.cache.get(params.bot.defaultTextChannel.id).send(`You need to tell me which song to remove... Use \`${prefix}playlist\` to see a list then give me the number of the song you want to remove.`);
        }
        else if (isNaN(item)) return params.bot.guild.channels.cache.get(params.bot.defaultTextChannel.id).send(`That's not a number you fool.`);
        else {
            let i = item-1
            let title = params.bot.audioQueue[i].videoDetails.title;
            params.bot.audioQueue.splice(i, 1);
            MAIN.eSender.socket.emit('sendBotInfo', [utils.dumbifyBot(params.bot)]);
            return params.bot.guild.channels.cache.get(params.bot.defaultTextChannel.id).send(`Removed \`${title}\` from the queue.`)
        }
    }
};