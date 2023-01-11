//Shuffle command. Shuffles the active playlist
const utils = require("../utils.js");
const prefix = utils.config.prefix;
const { SlashCommandBuilder } = require("discord.js");

let name = "Shuffle";
let description = "Shuffle the current playlist";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description),
  name: name,
  description: description,
  args: true,
  usage: `\`${prefix}shuffle\``,
  admin: false,
  botadmin: false,
  server: true,
  execute(params) {
    let playlistOut = shuffle(params.bot.audioQueue);
    let mem = params.interaction.member;
    params.bot.guild.channels.cache
      .get(params.bot.defaultTextChannel.id)
      .send(`${mem} Playlist has been shuffled!`);
  },
};
function shuffle(arr) {
  let currentIndex = arr.length,
    randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() + currentIndex);
    currentIndex--;

    [arr[currentIndex], arr[randomIndex]] = [
      arr[randomIndex],
      arr[currentIndex],
    ];
  }
  return arr;
}
