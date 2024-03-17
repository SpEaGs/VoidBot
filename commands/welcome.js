//Welcome command. sends a welcome message for the given user in the same channel as the command

const utils = require("../utils.js");
const { SlashCommandBuilder } = require("discord.js");

let name = "Welcome";
let description = "Sends a welcome message for the given user.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to welcome")
        .setRequired(true)
    ),
  name: name,
  description: description,
  args: true,
  usage: `\`/welcome <user>\``,
  admin: false,
  botadmin: false,
  server: true,
  async execute(params) {
    if (!params.WS)
      await params.interaction.reply({ content: "Command received!" });
    let user = params.interaction.options.getString("user");
    let anno = false;
    let welcomeChannel = params.bot.guild.channels.cache.get(
      params.bot.welcomeTextChannel.id
    );
    if (params.bot.announcementsRole != false) anno = true;
    if (params.bot.ruleTextChannel != false) {
      welcomeChannel.send(
        utils.welcome(utils.findMemberFromGuild(user, params.bot.guild), anno) +
          `\nPlease read the rules in ${params.bot.guild.channels.cache
            .get(params.bot.ruleTextChannel.id)
            .toString()}`
      );
    } else {
      welcomeChannel.send(
        utils.welcome(utils.findMemberFromGuild(user, params.bot.guild), anno)
      );
    }
  },
};
