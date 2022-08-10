//Join command. Makes the bot join the given voice channel, or, if none given, the voice channel the user is in.

const utils = require("../utils.js");
const prefix = utils.config.prefix;
const { SlashCommandBuilder } = require("discord.js");
const voice = require("@discordjs/voice");

let name = "Join";
let description =
  "Makes the bot join the given voice channel, or, if none given, the voice channel the user is in.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description)
    .addStringOption((option) =>
      option
        .setName("channel")
        .setDescription("The voice channel to join.")
        .setRequired(false)
    ),
  name: name,
  description: description,
  args: false,
  useage: `\`${prefix}join <voice channel>\``,
  admin: false,
  botadmin: false,
  server: true,
  execute(params, callback = false) {
    let log = global.log;
    let mem = params.interaction.member;
    let channel = params.interaction.options.getString("channel");
    if (!channel) {
      let voiceChannel = params.interaction.member.voice.channel;
      if (!!voiceChannel && voiceChannel === params.bot.voiceChannel)
        return params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(`${mem} I'm already in your voice channel...`);
      if (!voiceChannel)
        return params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(`${mem} You're not in a voice channel and none were given...`);
      return joinVoice(voiceChannel, params.bot);
    }
    let chan = utils.findChanFromGuild(channel, params.bot, 2);
    if (!!chan && chan === params.bot.voiceChannel)
      return params.bot.guild.channels.cache
        .get(params.bot.defaultTextChannel.id)
        .send(`${mem} I'm already in that voice channel...`);
    if (!chan)
      return params.bot.guild.channels.cache
        .get(params.bot.defaultTextChannel.id)
        .send(`${mem} That channel doesn't exist and no default is set.`);
    joinVoice(chan, params.bot);
    console.log(callback);
    if (!!callback) return callback();
  },
};

function joinVoice(voiceChannel, bot) {
  bot.voiceConnection = voice.joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
  });
  bot.voiceChannel = voiceChannel;
  utils.informClients(bot, { voiceChannel: bot.voiceChannel });
}
