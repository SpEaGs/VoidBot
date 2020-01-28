
//Welcome command. sends a welcome message for the given user in the same channel as the command

const utils = require('../utils.js');
const prefix = utils.config.prefix;

module.exports = {
    name: 'welcome',
    description: 'Sends a welcome message for the given user',
    alias: [],
    args: true,
    usage: `\`${prefix}welcome <user>\``,
    admin: false,
    botadmin: false,
    server: true,
    execute(params) {
        arg = params.args.join(' ')
        let anno = false;
        if (params.bot.announcementsRole != false) anno = true;
        if (params.bot.ruleTextChannel != false) {
            params.msg.channel.sendMessage(utils.welcome(utils.findMemberFromGuild(arg, params.bot.guild), anno)+`\nPlease read the rules in ${params.bot.guild.channels.get(params.bot.ruleTextChannel.id).toString()}`)
        }
        else {
            params.msg.channel.sendMessage(utils.welcome(utils.findMemberFromGuild(arg, params.bot.guild), anno));
        }

    }
}