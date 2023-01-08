//Leave command. Makes the bot stop playing audio, clear any queued songs, and leave whatever voice channel it's connected to.

const utils = require("../utils.js");
const prefix = utils.config.prefix;
const { SlashCommandBuilder } = require("discord.js");

let name = "Leave";
let description = `Makes the bot leave whatever voice channel it's in.`;

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description),
  name: name,
  description: description,
  args: false,
  useage: `\`${prefix}leave\``,
  admin: false,
  botadmin: false,
  server: true,
  execute(params) {
    if (!params.bot.voiceChannel) {
      let mem = params.interaction.member;
      return params.bot.guild.channels.cache
        .get(params.bot.defaultTextChannel.id)
        .send(`${mem} I'm not in a voice channel...`);
    }
    params.bot.audioQueue = [];
    if (!!params.bot.dispatcher) {
      params.bot.dispatcher.stop();
      params.bot.dispatcher = false;
    }
    params.bot.voiceConnection.destroy();
    params.bot.voiceChannel = false;
    params.bot.voiceConnection = false;
    utils.informClients(params.bot, { voiceChannel: params.bot.voiceChannel });
  },
};
