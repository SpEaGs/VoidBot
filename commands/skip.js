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
    if (!params.WS) params.interaction.reply({ content: "Command received!" });
    let mem = params.interaction.member;
    if (!params.bot.dispatcher)
      return params.WS
        ? params.bot.guild.channels.cache
            .get(params.bot.defaultTextChannel.id)
            .send("I'm not playing anything...")
        : params.interaction.editReply({
            content: "I'm not playing anything...",
          });
    try {
      params.WS
        ? params.bot.guild.channels.cache
            .get(params.bot.defaultTextChannel.id)
            .send(`${mem} Skipping...`)
        : params.interaction.editReply({ content: `${mem} Skipping...` });
      params.bot.dispatcher.stop();
      params.bot.dispatcher = false;
      params.bot.nowPlaying = false;
    } catch (error) {
      log(`Error skipping song:\n${error}`, ["[ERR]", "[SKIP]"]);
    }
  },
};
