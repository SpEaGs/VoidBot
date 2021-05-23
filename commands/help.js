//help command. Displays a list of commands. If given a command name or alias as an arg, displays that command's
//description, usage, and aliases (if any).

const utils = require('../utils.js');
const prefix = utils.config.prefix;

module.exports = {
    name: 'help',
    description: 'Displays a list of commands, or a given command\'s description, usage, and aliases (if any)',
    alias: ['?'],
    args: false,
    usage: `\`${prefix}help <command>\``,
    admin: false,
    botadmin: false,
    server: false,
    execute(params) {
        let log = global.log;
        if (!params.args.length) {
            let commandArray = []
            for (let c of params.bot.status.client.cmds.array()) {
                commandArray.splice(commandArray.length, 0, `${prefix}${c.name}`);
            }
            return params.msg.reply(`Commands: \`${commandArray.join('`, `')}\``);
        }
        if (params.args[0].toLowerCase() == 'all') {
            let toReturnArray = []
            for (let c of params.bot.status.client.cmds.array()) {
                if (cmd.alias !== false) {
                    toReturnArray.push(`\`${prefix}${c.name}\`:\n    Usage: ${s.usage}\n    ${c.description}\n    Aliases: \`${prefix}${c.alias.join('`, `')}\``);
                }
                else {
                    toReturnArray.push(`\`${prefix}${c.name}\`:\n    Usage: ${s.usage}\n    ${c.description}`);
                }
            }
            return params.msg.reply(`\n${toReturnArray.join(`\n\n`)}`);
        }

        let aliCheck = utils.aliasCheck(params.args[0], params.bot.status);
        if (!params.bot.status.client.cmds.has(params.args[0]) && !aliCheck) return params.msg.reply('The command or alias you asked for help with doesn\'t exist.');
        let cmd = aliCheck;
        if (!aliCheck) { cmd = params.bot.status.client.cmds.get(params.args[0]) }
        if (cmd.alias !== false) {
            return params.msg.reply(`\n\`${prefix}${cmd.name}\`:\nUsage: ${cmd.usage}\n${cmd.description}\nAliases: \`${prefix}${cmd.alias.join('`, `')}\``);
        }
        else {
            return params.msg.reply(`\n\`${prefix}${cmd.name}\`:\nUsage: ${cmd.usage}\n${cmd.description}`);
        }
    },
    regJSON: false
}