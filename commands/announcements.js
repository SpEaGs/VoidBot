//Announcements command. Lets the user opt in or out of the announcements role on the server they use this command in (if enabled)

const utils = require('../utils.js');
const prefix = utils.config.prefix;

module.exports = {
    name: 'announcements',
    description: 'Use this to opt in or out of announcements on this server if it is enabled',
    alias: ['anno'],
    args: false,
    usage: `\`${prefix}announcements <in/out>\``,
    admin: false,
    botadmin: false,
    server: false,
    execute(params) {
        let log = global.log;
        let mem = params.msg.member;
        if (!params.args.length) {
            return params.msg.reply(`You need to opt in or out.\nUsage: ${this.usage}`)
        }
        else if (params.args.length >= 1) {
            switch (params.args[0].toLowerCase()) {
                case 'in': {
                    mem.addRole(utils.config.sharding[params.bot.guildID].announcementsRole.id);
                    return params.msg.reply(`You've successfully opted IN to ${params.bot.guildName} announcements!`);
                }
                case 'out': {
                    mem.removeRole(utils.config.sharding[params.bot.guildID].announcementsRole.id);
                    return params.msg.reply(`You've successfully opten OUT of ${params.bot.guildName} announcements!`);
                }
            }
        }
    }
}