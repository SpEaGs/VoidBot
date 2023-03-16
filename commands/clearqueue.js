//Clear Queue command. Clears the active audio queue.

const utils = require("../utils.js");
const prefix = utils.prefix;
const { SlashCommandBuilder } = require("discord.js");

const name = "Clearqueue";
const description =
  "Clears the active audio queue without interrupting what is playing.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description),
  name: name,
  description: description,
  args: false,
  useage: `\`${prefix}clearqueue\``,
  admin: false,
  botadmin: false,
  server: true,
  execute(params) {
    if (params.bot.audioQueue && params.bot.audioQueue.length > 0) {
      params.bot.audioQueue = false;
      return params.bot.guild.channels.cache
        .get(params.bot.defaultTextChannel.id)
        .send("Cleared audio queue.");
    } else
      return params.bot.guild.channels.cache
        .get(params.bot.defaultTextChannel.id)
        .send("There is nothing in queue...");
  },
};
