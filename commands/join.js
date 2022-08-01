//Join command. Makes the bot join the given voice channel, or, if none given, the voice channel the user is in.

const utils = require("../utils.js");
const prefix = utils.config.prefix;

const MAIN = require("../main.js");

let name = "Join";
let description =
  "Makes the bot join the given voice channel, or, if none given, the voice channel the user is in.";

module.exports = {
  name: name,
  description: description,
  alias: ["j", "sum", "summon"],
  args: false,
  useage: `\`${prefix}join <voice channel>\``,
  admin: false,
  botadmin: false,
  server: true,
  execute(params) {
    let log = global.log;
    let mem = params.msg.member;
    if (params.args.length < 1) {
      let voiceChannel = params.msg.member.voice.channel;
      if (voiceChannel === params.bot.voiceChannel) {
        try {
          return params.msg.reply(`I'm already in that voice channel...`);
        } catch {
          return params.bot.guild.channels.cache
            .get(params.bot.defaultTextChannel.id)
            .send(`${mem} I'm already in that voice channel...`);
        }
      }
      if (
        !voiceChannel &&
        (!params.bot.dispatcher.playing || !params.bot.dispatcher)
      ) {
        try {
          return params.msg.reply(
            `You're not in a voice channel and none were given...`
          );
        } catch {
          return params.bot.guild.channels.cache
            .get(params.bot.defaultTextChannel.id)
            .send(
              `${mem} You're not in a voice channel and none were given...`
            );
        }
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
      try {
        params.msg.reply(`I'm already in that voice channel...`);
      } catch {
        return params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(`${mem} I'm already in that voice channel...`);
      }
    }
    try {
      joinVoice(chan, params.bot);
      return;
    } catch {
      try {
        params.msg.reply(
          `That channel doesn't exist or isn't a voice channel!`
        );
      } catch {
        return params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(`${mem} That channel doesn't exist or isn't a voice channel!`);
      }
    }
  },
  regJSON: {
    name: name,
    description: description,
    options: [
      {
        name: "channel",
        description: "Voice channel to join.",
        type: 3,
        required: false,
      },
    ],
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
