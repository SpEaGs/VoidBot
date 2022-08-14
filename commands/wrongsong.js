//Wrongsong command. Used to remove a song from the queue.

const utils = require("../utils.js");
const prefix = utils.config.prefix;
const { SlashCommandBuilder } = require("discord.js");

let name = "Wrongsong";
let description = "Removes a song from the queue.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description)
    .addIntegerOption((option) =>
      option
        .setName("number")
        .setDescription(
          "The queue position of the song to remove. (find it with /playlist)"
        )
        .setRequired(true)
    ),
  name: name,
  description: description,
  args: false,
  usage: `\`${prefix}wrongsong <number/np>\``,
  admin: false,
  botadmin: false,
  server: true,
  execute(params) {
    let mem = params.interaction.member;
    let number = params.interaction.options.getInteger("number");
    if (number > params.bot.audioQueue.length) {
      return params.bot.guild.channels.cache
        .get(params.bot.defaultTextChannel.id)
        .send(`${mem} The playlist isn't even ${number} songs long...`);
    } else if (number < 0) {
      return params.bot.guild.channels.cache
        .get(params.bot.defaultTextChannel.id)
        .send(`${mem} That was a negative number...`);
    } else if (isNaN(number)) {
      return params.bot.guild.channels.cache
        .get(params.bot.defaultTextChannel.id)
        .send(`${mem} That's not a number you fool.`);
    } else {
      let i = number - 1;
      let title = params.bot.audioQueue[i].videoDetails.title;
      params.bot.audioQueue.splice(i, 1);
      utils.informClients(params.bot, { audioQueue: params.bot.audioQueue });
      return params.bot.guild.channels.cache
        .get(params.bot.defaultTextChannel.id)
        .send(`${mem} Removed \`${title}\` from the queue.`);
    }
  },
};
