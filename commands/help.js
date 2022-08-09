//help command. Displays a list of commands. If given a command name as an arg, displays that command's
//description and usage.

const utils = require("../utils.js");
const prefix = utils.config.prefix;
const status = require("../main.js");
const { SlashCommandBuilder } = require("discord.js");

let name = "Help";
let description =
  "Displays a list of commands, or a given command's description and usage.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description)
    .addStringOption((option) =>
      option
        .setName("command")
        .setDescription("The command to get help with")
        .setRequired(false)
    ),
  name: name,
  description: description,
  args: false,
  usage: `\`${prefix}help <command>\``,
  admin: false,
  botadmin: false,
  server: false,
  execute(params) {
    let log = global.log;
    let mem = params.interaction.member;
    let command = params.interaction.options.getString("command");
    if (!command) {
      let commandArray = [];
      params.bot.status.client.cmds.forEach((c) => {
        commandArray.push(`${prefix}${c.name}`);
      });
      return params.bot.guild.channels.cache
        .get(params.bot.defaultTextChannel.id)
        .send(`${mem} Commands: \`${commandArray.join("`, `")}\``);
    }
    if (command === "all") {
      let toReturnArray = [];
      params.bot.status.client.cmds.forEach((c) => {
        toReturnArray.push(
          `\`${prefix}${c.name}\`:\n    Usage: ${s.usage}\n    ${c.description}`
        );
      });
      return params.bot.guild.channels.cache
        .get(params.bot.defaultTextChannel.id)
        .send(`${mem} \n${toReturnArray.join(`\n\n`)}`);
    }
    if (!params.bot.status.client.cmds.has(command)) {
      return params.bot.guild.channels.cache
        .get(params.bot.defaultTextChannel.id)
        .send(`${mem} The command you asked for help with doesn\'t exist.`);
    }
    let cmd = params.bot.status.client.cmds.get(command);
    return params.bot.guild.channels.cache
      .get(params.bot.defaultTextChannel.id)
      .send(
        `${mem} \n\`${prefix}${cmd.name}\`:\nUsage: ${cmd.usage}\n${cmd.description}`
      );
  },
};
