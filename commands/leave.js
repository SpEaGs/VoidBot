//Leave command. Makes the bot stop playing audio, clear any queued songs, and leave whatever voice channel it's connected to.

const utils = require("../utils.js");
const prefix = utils.config.prefix;

const MAIN = require("../main.js");

let name = "leave";
let description = `Makes the bot leave whatever voice channel it's in.`;

module.exports = {
  name: name,
  description: description,
  alias: ["l"],
  args: false,
  useage: `\`${prefix}leave\``,
  admin: false,
  botadmin: false,
  server: true,
  execute(params) {
    let mem = params.msg.member;
    if (!params.bot.voiceChannel) {
      try {
        return params.msg.reply(`I'm not in a voice channel...`);
      } catch {
        return params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(`${mem} I'm not in a voice channel...`);
      }
    }
    params.bot.audioQueue = [];
    if (params.bot.dispatcher !== false) {
      params.bot.dispatcher.end();
      params.bot.dispatcher = false;
    }
    try {
      params.bot.voiceChannel.leave();
    } catch {
      params.bot.guild.channels.cache.get(params.bot.voiceChannel.id).leave();
    }
    params.bot.voiceChannel = false;
    params.bot.voiceConnection = false;
    utils.informClients(params.bot, { voiceChannel: params.bot.voiceChannel });
  },
  regJSON: {
    name: name,
    description: description,
  },
};
