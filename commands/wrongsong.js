
//Wrongsong command. Used to remove a song from the queue.

const utils = require('../utils.js');
const prefix = utils.config.prefix;

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
            return params.msg.reply(`You need to tell me which song to remove... Use \`${prefix}playlist\` to see a list then give me the number of the song you want to remove.`);
        }
        else if (isNaN(item)) return params.msg.reply(`That's not a number you fool.`);
        else {
            let i = item-1
            let title = params.bot.audioQueue[i].title;
            params.bot.audioQueue.splice(i, 1);
            return params.msg.reply(`Removed \`${title}\` from the queue.`)
        }
    }
};