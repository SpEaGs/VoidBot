//Join command. Makes the bot join the given voice channel, or, if none given, the voice channel the user is in.

const utils = require("../utils.js");
const { SlashCommandBuilder } = require("discord.js");
const voice = require("@discordjs/voice");
const { log, warn, err } = require("../logger.js");

let name = "Join";
let description =
  "Makes the bot join the given voice channel, or, if none given, the voice channel the user is in.";

function joinVoice(voiceChannel, bot) {
  bot.voiceConnection = voice.joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
  });
  bot.voiceChannel = voiceChannel;
  utils.informClients(bot, { voiceChannel: bot.voiceChannel });
  return bot.voiceConnection;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description)
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The voice channel to join.")
        .setRequired(false)
        .addChannelTypes(2)
    ),
  name: name,
  description: description,
  args: false,
  useage: `\`/join <voice channel>\``,
  admin: false,
  botadmin: false,
  server: true,
  joinVoice,
  async execute(params) {
    if (!params.WS)
      try {
        await params.interaction.reply({ content: "Command received!" });
      } catch (e) {
        warn(
          "Interaction reply failed. Likely this command was called from /play.",
          ["[JOIN]"],
          e
        );
      }
    let mem = params.interaction.member;
    const chan = params.WS
      ? utils.findChanFromGuild(params.interaction.args.channel, params.bot, 2)
      : params.interaction.options.getChannel("channel");
    if (!chan) {
      let voiceChannel = params.interaction.member.voice.channel;
      if (!!voiceChannel && voiceChannel === params.bot.voiceChannel)
        return params.WS
          ? params.bot.guild.channels.cache
              .get(params.bot.defaultTextChannel.id)
              .send(`${mem} I'm already in your voice channel...`)
          : params.interaction.editReply({
              content: `${mem} I'm already in your voice channel...`,
            });
      if (!voiceChannel)
        return params.WS
          ? params.bot.guild.channels.cache
              .get(params.bot.defaultTextChannel.id)
              .send(
                `${mem} You're not in a voice channel and none were given...`
              )
          : params.interaction.editReply({
              content: `${mem} You're not in a voice channel and none were given...`,
            });
      return joinVoice(voiceChannel, params.bot);
    }
    if (!!chan && chan === params.bot.voiceChannel)
      return params.WS
        ? params.bot.guild.channels.cache
            .get(params.bot.defaultTextChannel.id)
            .send(`${mem} I'm already in that voice channel...`)
        : params.interaction.editReply({
            content: `${mem} I'm already in that voice channel...`,
          });
    return joinVoice(chan, params.bot);
  },
};
