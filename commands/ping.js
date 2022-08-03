//Ping command. Returns 'Pong!'

const utils = require("../utils.js");
const prefix = utils.config.prefix;
const { SlashCommandBuilder } = require("discord.js");

let name = "Ping";
let description = "Ping!";

module.exports = {
  data: new SlashCommandBuilder().setName(name).setDescription(description),
  name: name,
  description: description,
  alias: false,
  args: false,
  usage: `\`${prefix}ping\``,
  admin: false,
  botadmin: false,
  server: false,
  execute(params) {
    let mem = params.msg.member;
    try {
      params.msg.reply("Pong!");
    } catch {
      params.bot.guild.channels.cache
        .get(params.bot.defaultTextChannel.id)
        .send(`${mem} Pong!`);
    }
  },
};
