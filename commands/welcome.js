//Welcome command. sends a welcome message for the given user in the same channel as the command

const utils = require("../utils.js");
const prefix = utils.config.prefix;
const { SlashCommandBuilder } = require("discord.js");

let name = "Welcome";
let description = "Sends a welcome message for the given user.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name)
    .setDescription(description)
    .addStringOption((option) =>
      option
        .setName("user")
        .setDescription("The user to welcome")
        .setRequired(true)
    ),
  name: name,
  description: description,
  alias: [],
  args: true,
  usage: `\`${prefix}welcome <user>\``,
  admin: false,
  botadmin: false,
  server: true,
  execute(params) {
    arg = params.args.join(" ");
    let anno = false;
    let welcomeChannel = params.bot.guild.channels.cache.get(
      params.bot.welcomeTextChannel.id
    );
    if (params.bot.announcementsRole != false) anno = true;
    if (params.bot.ruleTextChannel != false) {
      welcomeChannel.send(
        utils.welcome(utils.findMemberFromGuild(arg, params.bot.guild), anno) +
          `\nPlease read the rules in ${params.bot.guild.channels.cache
            .get(params.bot.ruleTextChannel.id)
            .toString()}`
      );
    } else {
      welcomeChannel.send(
        utils.welcome(utils.findMemberFromGuild(arg, params.bot.guild), anno)
      );
    }
  },
};
