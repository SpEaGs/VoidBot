
//Wrongsong command. Used to remove a song from the queue.

const utils = require('../utils.js');
const prefix = utils.config.prefix;

const MAIN = require('../main.js');

let name = 'wrongsong'
let description = 'Removes a song from the queue.'

module.exports = {
    name: name,
    description: description,
    alias: ['ws'],
    args: false,
    usage: `\`${prefix}wrongsong <number/np>\``,
    admin: false,
    botadmin: false,
    server: true,
    execute(params) {
        let mem = params.msg.member;
        let item = parseInt(params.args)
        if (!params.args.length) {
            try { return params.msg.reply(`You need to tell me which song to remove... Use \`${prefix}playlist\` to see a list then give me the number of the song you want to remove.`) }
            catch { return params.bot.guild.channels.cache.get(params.bot.defaultTextChannel.id).send(`${mem} You need to tell me which song to remove... Use \`${prefix}playlist\` to see a list then give me the number of the song you want to remove.`) }
        }
        else if (isNaN(item)) {
            try { return params.msg.reply(`That's not a number you fool.`) }
            catch { return params.bot.guild.channels.cache.get(params.bot.defaultTextChannel.id).send(`${mem} That's not a number you fool.`) }
        }
        else {
            let i = item-1
            let title = params.bot.audioQueue[i].videoDetails.title;
            params.bot.audioQueue.splice(i, 1);
            MAIN.eSender.socket.emit('sendBotInfo', [utils.dumbifyBot(params.bot)]);
            try { return params.msg.reply(`Removed \`${title}\` from the queue.`) }
            catch { return params.bot.guild.channels.cache.get(params.bot.defaultTextChannel.id).send(`${mem} Removed \`${title}\` from the queue.`) }
        }
    },
    regJSON: {
        name: name,
        description: description,
        options: [
            {
                name: 'number',
                description: 'Queue number of the song to remove. (find it with /playlist)',
                type: 4,
                required: true
            }
        ]
    }
};