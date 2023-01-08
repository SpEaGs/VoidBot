//Slap command. Slaps a user (metaphorically)
const utils = require("../utils.js");
const prefix = utils.config.prefix;
const { SlashCommandBuilder } = require("discord.js");

let name = "Slap";
let description = "Slap someone!";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description)
    .addStringOption((option) =>
      option
        .setName("user")
        .setDescription("The user to slap.")
        .setRequired(true)
    ),
  name: name,
  description: description,
  args: true,
  usage: `\`${prefix}slap <user to slap>\``,
  admin: false,
  botadmin: false,
  server: true,
  execute(params) {
    let mem = params.interaction.member;
    let slappee = utils.findMemberFromGuild(
      params.args.join(" "),
      params.bot.guild
    );
    params.bot.guild.channels.cache
      .get(params.bot.defaultTextChannel.id)
      .send(`${mem} I SLAP YOU, ${slappee}, YOU INSOLENT FOOL!!!`);
  },
};
