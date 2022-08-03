//Resume command. Resumes the bot's current audio stream.

const utils = require("../utils.js");
const prefix = utils.config.prefix;
const { SlashCommandBuilder } = require("discord.js");

let name = "Resume";
let description = "Resumes the bot's current audio stream.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description),
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
        utils.informClients(params.bot, {
          paused: params.bot.dispatcher.paused,
        });
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
};
