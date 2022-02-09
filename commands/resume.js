//Resume command. Resumes the bot's current audio stream.

const utils = require("../utils.js");
const prefix = utils.config.prefix;

const MAIN = require("../main.js");

let name = "resume";
let description = "Resumes the bot's current audio stream.";

module.exports = {
  name: name,
  description: description,
  alias: false,
  args: false,
  usage: `\`${prefix}resume\``,
  admin: false,
  botadmin: false,
  server: true,
  execute(params) {
    let mem = params.msg.member;
    switch (params.bot.dispatcher.paused) {
      case true: {
        params.bot.dispatcher.resume();
        try {
          params.msg.reply(`Audio stream resumed.`);
        } catch {
          params.bot.guild.channels.cache
            .get(params.bot.defaultTextChannel.id)
            .send(`${mem} Audio stream resumed.`);
        }
        break;
      }
      case false: {
        try {
          params.msg.reply(`Audio stream is already playing.`);
        } catch {
          params.bot.guild.channels.cache
            .get(params.bot.defaultTextChannel.id)
            .send(`${mem} Audio stream is already playing.`);
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
