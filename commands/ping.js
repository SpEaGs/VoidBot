//Ping command. Returns 'Pong!'

const { SlashCommandBuilder } = require("discord.js");

let name = "Ping";
let description = "Ping!";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description),
  name: name,
  description: description,
  args: false,
  usage: `\`/ping\``,
  admin: false,
  botadmin: false,
  server: false,
  async execute(params) {
    if (!params.WS)
      await params.interaction.reply({
        content: `${params.interaction.member} Pong!`,
      });
    else
      params.bot.guild.channels.cache
        .get(params.bot.defaultTextChannel.id)
        .send(`${params.interaction.member} Pong!`);
  },
};
