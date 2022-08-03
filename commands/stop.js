//stop command. Ends the bot's active audio stream, paused or otherwise.

const utils = require("../utils.js");
const prefix = utils.config.prefix;
const { SlashCommandBuilder } = require("discord.js");

let name = "Stop";
let description = "Stops the bot's currently playing audio stream.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description),
  name: name,
  description: description,
  alias: false,
  args: false,
  usage: `\`${prefix}stop\``,
  admin: false,
  botadmin: false,
  server: true,
  execute(params) {
    let log = global.log;
    try {
      params.bot.audioQueue = [];
      stopAudio(params);
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

function stopAudio(params) {
  let mem = params.msg.member;
  try {
    params.bot.dispatcher.pause();
  } catch (error) {}
  try {
    params.msg.reply(`Audio stream ended.`);
  } catch {
    params.bot.guild.channels.cache
      .get(params.bot.defaultTextChannel.id)
      .send(`${mem} Audio stream ended.`);
  }
}
