//help command. Displays a list of commands. If given a command name as an arg, displays that command's
//description and usage.

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
  usage: `\`/help <command>\``,
  admin: false,
  botadmin: false,
  server: false,
  async execute(params) {
    if (!params.WS)
      await params.interaction.reply({ content: "Command received!" });
    let mem = params.interaction.member;
    let command = params.interaction.options.getString("command");
    if (!command) {
      let commandArray = [];
      params.bot.status.client.cmds.forEach((c) => {
        commandArray.push(`/${c.name}`);
      });
      return params.WS
        ? params.bot.guild.channels.cache
            .get(params.bot.defaultTextChannel.id)
            .send(`${mem} Commands: \`${commandArray.join("`, `")}\``)
        : params.interaction.editReply({
            content: `${mem} Commands: \`${commandArray.join("`, `")}\``,
          });
    }
    if (command === "all") {
      let toReturnArray = [];
      params.bot.status.client.cmds.forEach((c) => {
        toReturnArray.push(
          `\`/${c.name}\`:\n    Usage: ${c.usage}\n    ${c.description}`
        );
      });
      return params.WS
        ? params.bot.guild.channels.cache
            .get(params.bot.defaultTextChannel.id)
            .send(`${mem} \n${toReturnArray.join(`\n\n`)}`)
        : params.interaction.editReply({
            content: `${mem} \n${toReturnArray.join(`\n\n`)}`,
          });
    }
    if (!params.bot.status.client.cmds.has(command)) {
      return params.WS
        ? params.bot.guild.channels.cache
            .get(params.bot.defaultTextChannel.id)
            .send(`${mem} The command you asked for help with doesn\'t exist.`)
        : params.interaction.editReply({
            content: `${mem} The command you asked for help with doesn\'t exist.`,
          });
    }
    let cmd = params.bot.status.client.cmds.get(command);
    return params.WS
      ? params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(
            `${mem} \n\`/${cmd.name}\`:\nUsage: ${cmd.usage}\n${cmd.description}`
          )
      : params.interaction.editReply({
          content: `${mem} \n\`/${cmd.name}\`:\nUsage: ${cmd.usage}\n${cmd.description}`,
        });
  },
};
