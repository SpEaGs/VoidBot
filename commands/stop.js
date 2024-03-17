//stop command. Ends the bot's active audio stream, paused or otherwise.

const utils = require("../utils.js");
const { SlashCommandBuilder } = require("discord.js");

let name = "Stop";
let description =
  "Stops the bot's currently playing audio stream and clears the queue.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description),
  name: name,
  description: description,
  args: false,
  usage: `\`/stop\``,
  admin: false,
  botadmin: false,
  server: true,
  async execute(params) {
    if (!params.WS)
      await params.interaction.reply({ content: "Command received!" });
    let log = global.log;
    let mem = params.interaction.member;
    if (!params.bot.dispatcher)
      return params.bot.guild.channels
        .get(params.bot.defaultTextChannel.id)
        .send("I'm not playing anything...");
    try {
      params.bot.audioQueue = [];
      params.bot.dispatcher.stop();
      params.WS
        ? params.bot.guild.channels.cache
            .get(params.bot.defaultTextChannel.id)
            .send(`${mem} Audio stream ended and queue cleared.`)
        : params.interaction.editReply({
            content: `${mem} Audio stream ended and queue cleared.`,
          });
      params.bot.dispatcher = false;
      params.bot.nowPlaying = false;
    } catch (error) {
      log(`Error stopping music:\n${error}`, ["[ERR]", "[STOP]"]);
    }
    utils.informClients(params.bot, {
      audioQueue: params.bot.audioQueue,
      paused: false,
      nowPlaying: false,
    });
  },
};
