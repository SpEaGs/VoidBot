//Join command. Makes the bot join the given voice channel, or, if none given, the voice channel the user is in.

const utils = require("../utils.js");
const prefix = utils.config.prefix;
const { SlashCommandBuilder } = require("discord.js");

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
  execute(params) {
    let log = global.log;
    let mem = params.interaction.member;
    let channel = params.interaction.options.getString("channel");
    if (!channel) {
      let voiceChannel = params.interaction.member.voice.channel;
      if (voiceChannel === params.bot.voiceChannel) {
        return params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(`${mem} I'm already in that voice channel...`);
      }
      if (
        !voiceChannel &&
        (!params.bot.dispatcher.playing || !params.bot.dispatcher)
      ) {
        return params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(`${mem} You're not in a voice channel and none were given...`);
      }
      joinVoice(voiceChannel, params.bot);
      return;
    }
    let chan = utils.findChanFromGuild(
      params.args.join(" "),
      params.bot.guild,
      "voice"
    );
    if (chan === params.bot.voiceChannel) {
      return params.bot.guild.channels.cache
        .get(params.bot.defaultTextChannel.id)
        .send(`${mem} I'm already in that voice channel...`);
    }
    try {
      joinVoice(chan, params.bot);
      return;
    } catch {
      return params.bot.guild.channels.cache
        .get(params.bot.defaultTextChannel.id)
        .send(`${mem} That channel doesn't exist or isn't a voice channel!`);
    }
  },
};

function joinVoice(voiceChannel, status) {
  try {
    voiceChannel.join().then((connection) => {
      status.voiceConnection = connection;
    });
  } catch {
    status.guild.channels
      .get(voiceChannel.id)
      .join()
      .then((connection) => {
        status.voiceConnection = connection;
      });
  }
  status.voiceChannel = voiceChannel;
  utils.informClients(status, { voiceChannel: status.voiceChannel });
}
