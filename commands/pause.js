//Pause command. Pauses the bot's current audio stream.

const utils = require("../utils.js");
const prefix = utils.config.prefix;

const MAIN = require("../main.js");

let name = "pause";
let description = "Pauses the bot's currently playing audio stream.";

module.exports = {
  name: name,
  description: description,
  alias: false,
  args: false,
  usage: `\`${prefix}pause\``,
  admin: false,
  botadmin: false,
  server: true,
  execute(params) {
    let mem = params.msg.member;
    switch (params.bot.dispatcher.paused) {
      case false: {
        params.bot.dispatcher.pause();
        try {
          params.msg.reply(
            `Audio stream paused. Use \`${prefix}resume\` to resume.`
          );
        } catch {
          params.bot.guild.channels.cache
            .get(params.bot.defaultTextChannel.id)
            .send(
              `${mem} Audio stream paused. Use \`${prefix}resume\` to resume.`
            );
        }
        break;
      }
      case true: {
        try {
          params.msg.reply(
            `Audio stream is already paused. Use \`${prefix}resume\` to resume.`
          );
        } catch {
          params.bot.guild.channels.cache
            .get(params.bot.defaultTextChannel.id)
            .send(
              `${mem} Audio stream is already paused. Use \`${prefix}resume\` to resume.`
            );
        }
        break;
      }
    }
  },
  regJSON: {
    name: name,
    description: description,
  },
};
