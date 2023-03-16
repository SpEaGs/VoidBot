//Resume command. Resumes the bot's current audio stream.

const utils = require("../utils.js");
const { SlashCommandBuilder } = require("discord.js");

let name = "Resume";
let description = "Resumes the bot's current audio stream.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description),
  name: name,
  description: description,
  args: false,
  usage: `\`/resume\``,
  admin: false,
  botadmin: false,
  server: true,
  execute(params) {
    let mem = params.interaction.member;
    switch (params.bot.dispatcher.paused) {
      case true: {
        params.bot.dispatcher.unpause();
        params.bot.dispatcher.paused = false;
        params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(`${mem} Audio stream resumed.`);
        utils.informClients(params.bot, {
          paused: params.bot.dispatcher.paused,
        });
        break;
      }
      case false: {
        params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(`${mem} Audio stream is already playing.`);
        break;
      }
    }
  },
};
