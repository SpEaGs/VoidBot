
//Prune command. Deletes given number of messages from the channel in which the command was sent.

const utils = require('../utils.js');
const prefix = utils.config.prefix;

module.exports = {
    name: 'prune',
    description: 'Prunes given number of messages from the channel in which the command was sent. Admin only.',
    alias: false,
    args: true,
    usage: `\`${prefix}prune {amount}\``,
    admin: true,
    botadmin: false,
    server: true,
    execute(params) {
        const amount = parseInt(params.args[0]);
        if (isNaN(amount)) {
            return params.msg.reply('That\'s not a real number scrub!');
        };
        var caseCheck = 0;
        if (amount >= 2 && amount <= 100) caseCheck = 2;
        else if (amount > 100) caseCheck = 3;
        else caseCheck = amount;

        switch (caseCheck) {
            case 0: return params.msg.reply('H... Hokay... deleting 0 messages then...');
            case 1: return params.msg.reply('Pruning currently only works for 2 or more messages.');
            case 2:
                params.msg.channel.bulkDelete((amount+1), true).catch(err => {
                    console.error(err);
                    params.msg.reply('Pruning error. Likely that all applicable messages are too (2 weeks) old.');
                });
                return params.msg.reply(`Pruned ${amount} messages`);
            case 3: return params.msg.reply('For reasons unfathomable, I can\'t prune more than 100 messages.');
        };
    },
};