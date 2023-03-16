//stop command. Ends the bot's active audio stream, paused or otherwise.

const { SlashCommandBuilder } = require("discord.js");

let name = "Skip";
let description = "Skips the bot's currently playing audio stream.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description),
  name: name,
  description: description,
  args: false,
  usage: `\`/skip\``,
  admin: false,
  botadmin: false,
  server: true,
  execute(params) {
    let log = global.log;
    let mem = params.interaction.member;
    if (!params.bot.dispatcher)
      return params.bot.guild.channels.cache
        .get(params.bot.defaultTextChannel.id)
        .send("I'm not playing anything...");
    try {
      params.bot.guild.channels.cache
        .get(params.bot.defaultTextChannel.id)
        .send(`${mem} Skipping...`);
      params.bot.dispatcher.stop();
      params.bot.dispatcher = false;
      params.bot.nowPlaying = false;
    } catch (error) {
      log(`Error skipping song:\n${error}`, ["[ERR]", "[SKIP]"]);
    }
  },
};
