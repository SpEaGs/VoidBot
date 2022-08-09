//stop command. Ends the bot's active audio stream, paused or otherwise.

const utils = require("../utils.js");
const play = require("./play.js");
const prefix = utils.config.prefix;
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
  usage: `\`${prefix}skip\``,
  admin: false,
  botadmin: false,
  server: true,
  execute(params) {
    let log = global.log;
    try {
      stopAudio(params.bot.dispatcher, params.bot);
      params.bot.dispatcher = false;
      params.bot.nowPlaying = false;
      if (params.bot.audioQueue.length != 0) play.playNextInQueue(params.bot);
    } catch (error) {
      log(`Error skipping song:\n${error}`, ["[ERR]", "[SKIP]"]);
    }
  },
};

function stopAudio(dispatcher, bot) {
  dispatcher.pause();
  bot.guild.channels.cache.get(bot.defaultTextChannel.id).send(`Skipping...`);
}
