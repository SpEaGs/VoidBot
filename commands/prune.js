
//Prune command. Deletes given number of messages from the channel in which the command was sent.

const utils = require('../utils.js');
const prefix = utils.config.prefix;

let name = 'prune'
let description = 'Prunes given number of messages from the given channel. Admin only.'

module.exports = {
    name: name,
    description: description,
    alias: false,
    args: true,
    usage: `\`${prefix}prune {amount} {channel}\``,
    admin: true,
    botadmin: false,
    server: true,
    execute(params) {
        if (params.args.length <2) {
            return params.msg.reply('Please specify the channel to prune.');
        }
        const amount = parseInt(params.args[0]);
        const chan = utils.findChanFromGuild(params.args[1], params.bot.guild);
        if (isNaN(amount)) {
            return params.msg.reply('That\'s not a real number scrub!');
        };
        if (!chan) {
            return params.msg.reply('That channel doesn\'t exist you simp!');
        };
        var caseCheck = 0;
        if (amount >= 2 && amount <= 100) caseCheck = 2;
        else if (amount > 100) caseCheck = 3;
        else caseCheck = amount;

        switch (caseCheck) {
            case 0: return params.msg.reply('H... Hokay... deleting 0 messages then...');
            case 1: return params.msg.reply('Pruning currently only works for 2 or more messages.');
            case 2:
                chan.bulkDelete((amount+1), true).catch(err => {
                    console.error(err);
                    params.msg.reply('Pruning error. Likely that all applicable messages are too (2 weeks) old.');
                });
                return params.msg.reply(`Pruned ${amount} messages from ${chan.name}`);
            case 3: return params.msg.reply('For reasons unfathomable, I can\'t prune more than 100 messages.');
        };
    },
    regJSON: {
        name: name,
        description: description,
        options: [
            {
                name: 'amount',
                description: 'Number of messages to prune.',
                type: 3,
                required: true
            },
            {
                name: 'channel',
                description: 'Channel to prune from.',
                type: 3,
                required: true
            }
        ]
    }
};