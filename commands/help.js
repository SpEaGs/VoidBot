//help command. Displays a list of commands. If given a command name or alias as an arg, displays that command's
//description, usage, and aliases (if any).

const utils = require("../utils.js");
const prefix = utils.config.prefix;
const status = require("../main.js");
const { SlashCommandBuilder } = require("discord.js");

let name = "Help";
let description =
  "Displays a list of commands, or a given command's description, usage, and aliases (if any)";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name)
    .setDescription(description)
    .addStringOption((option) => {
      option
        .setName("command")
        .setDescription("The command to get help with")
        .setRequired(false);
      for (let cmd of status.client.cmds) {
        option.addChoices({ name: cmd.name, value: cmd.name });
      }
      return option;
    }),
  name: name,
  description: description,
  alias: ["?"],
  args: false,
  usage: `\`${prefix}help <command>\``,
  admin: false,
  botadmin: false,
  server: false,
  execute(params) {
    let log = global.log;
    let mem = params.msg.member;
    if (!params.args.length) {
      let commandArray = [];
      for (let c of params.bot.status.client.cmds) {
        commandArray.splice(commandArray.length, 0, `${prefix}${c.name}`);
      }
      try {
        return params.msg.reply(`Commands: \`${commandArray.join("`, `")}\``);
      } catch {
        return params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(`${mem} Commands: \`${commandArray.join("`, `")}\``);
      }
    }
    if (params.args[0].toLowerCase() == "all") {
      let toReturnArray = [];
      for (let c of params.bot.status.client.cmds) {
        if (cmd.alias !== false) {
          toReturnArray.push(
            `\`${prefix}${c.name}\`:\n    Usage: ${s.usage}\n    ${
              c.description
            }\n    Aliases: \`${prefix}${c.alias.join("`, `")}\``
          );
        } else {
          toReturnArray.push(
            `\`${prefix}${c.name}\`:\n    Usage: ${s.usage}\n    ${c.description}`
          );
        }
      }
      try {
        return params.msg.reply(`\n${toReturnArray.join(`\n\n`)}`);
      } catch {
        return params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(`${mem} \n${toReturnArray.join(`\n\n`)}`);
      }
    }

    let aliCheck = utils.aliasCheck(params.args[0], params.bot.status);
    if (!params.bot.status.client.cmds.has(params.args[0]) && !aliCheck) {
      try {
        return params.msg.reply(
          "The command or alias you asked for help with doesn't exist."
        );
      } catch {
        return params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(
            `${mem} The command or alias you asked for help with doesn\'t exist.`
          );
      }
    }
    let cmd = aliCheck;
    if (!aliCheck) {
      cmd = params.bot.status.client.cmds.get(params.args[0]);
    }
    if (cmd.alias !== false) {
      try {
        return params.msg.reply(
          `\n\`${prefix}${cmd.name}\`:\nUsage: ${cmd.usage}\n${
            cmd.description
          }\nAliases: \`${prefix}${cmd.alias.join("`, `")}\``
        );
      } catch {
        return params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(
            `${mem} \n\`${prefix}${cmd.name}\`:\nUsage: ${cmd.usage}\n${
              cmd.description
            }\nAliases: \`${prefix}${cmd.alias.join("`, `")}\``
          );
      }
    } else {
      try {
        return params.msg.reply(
          `\n\`${prefix}${cmd.name}\`:\nUsage: ${cmd.usage}\n${cmd.description}`
        );
      } catch {
        return params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(
            `${mem} \n\`${prefix}${cmd.name}\`:\nUsage: ${cmd.usage}\n${cmd.description}`
          );
      }
    }
  },
};
