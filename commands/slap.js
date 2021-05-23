
//Slap command. Slaps a user (metaphorically)
const utils = require('../utils.js');
const prefix = utils.config.prefix;

module.exports = {
    name: 'slap',
    description: 'Slap someone!',
    alias: false,
    args: true,
    usage: `\`${prefix}slap <user to slap>\``,
    admin: false,
    botadmin: false,
    server: true,
    execute(params) {
        let slappee = utils.findMemberFromGuild(params.args.join(' '), params.bot.guild)
        params.msg.reply(`I SLAP YOU, ${slappee}, YOU INSOLENT FOOL!!!`);
    },
    regJSON: {
        name: this.name,
        description: this.description,
        options: [
            {
                name: 'user',
                description: 'user to slap',
                type: 3,
                required: true
            }
        ]
    }
};