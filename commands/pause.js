//Pause command. Pauses the bot's current audio stream.

const utils = require("../utils.js");
const { SlashCommandBuilder } = require("discord.js");

let name = "Pause";
let description = "Pauses the bot's currently playing audio stream.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description),
  name: name,
  description: description,
  args: false,
  usage: `\`/pause\``,
  admin: false,
  botadmin: false,
  server: true,
  execute(params) {
    let mem = params.interaction.member;
    switch (params.bot.dispatcher.paused) {
      case false: {
        params.bot.dispatcher.pause();
        params.bot.dispatcher.paused = true;
        params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(`${mem} Audio stream paused. Use \`/resume\` to resume.`);
        utils.informClients(params.bot, {
          paused: params.bot.dispatcher.paused,
        });
        break;
      }
      case true: {
        params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(
            `${mem} Audio stream is already paused. Use \`/resume\` to resume.`
          );
        break;
      }
    }
  },
};
