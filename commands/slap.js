//Slap command. Slaps a user (metaphorically)
const utils = require("../utils.js");
const { SlashCommandBuilder } = require("discord.js");

let name = "Slap";
let description = "Slap someone!";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to slap.")
        .setRequired(true)
    ),
  name: name,
  description: description,
  args: true,
  usage: `\`/slap <user to slap>\``,
  admin: false,
  botadmin: false,
  server: true,
  async execute(params) {
    let mem = params.interaction.member;
    let slappee = params.interaction.options.getUser("user");
    params.WS
      ? params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(`${mem} I SLAP YOU, ${slappee}, YOU INSOLENT FOOL!!!`)
      : await params.interaction.reply({
          content: `${mem} I SLAP YOU, ${slappee}, YOU INSOLENT FOOL!!!`,
        });
  },
};
