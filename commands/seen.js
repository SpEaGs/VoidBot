
//Seen command. Gets when a user was last seen
const utils = require('../utils.js');
const prefix = utils.config.prefix;
const status = require('../main.js');

module.exports = {
    name: 'seen',
    description: 'Gets how long ago a user was last online/active.',
    alias: false,
    args: true,
    usage: `\`${prefix}seen <user to find>\``,
    admin: false,
    botadmin: false,
    server: true,
    execute(params) {
        let target = utils.findMemberFromGuild(params.args.join(' '), params.bot.guild)
        if (!target) return params.msg.reply("I couldn't find that member.")
        let timeDiff = utils.getTimeRaw() - status.client.lastSeen[target.id]
        let seen = utils.msToTime(timeDiff);
        switch (target.presence.status) {
            case 'online': {
                params.msg.reply(`That user is online right now you lazy fool!`);
                break;
            }
            case 'offline': {
                params.msg.reply(`That user is offline and was last seen ${seen} ago.`);
                break;
            }
            case 'idle': {
                params.msg.reply(`That user is AFK/Idle and was last active ${seen} ago.`);
                break;
            }
            case 'dnd': {
                params.msg.reply(`That user is set to Do not Disturb and was last available ${seen} ago.`);
                break;
            }
        }
    },
    regJSON: {
        name: this.name,
        description: this.description,
        options: [
            {
                name: 'user',
                description: 'User to find.',
                type: 3,
                required: true
            }
        ]
    }
};