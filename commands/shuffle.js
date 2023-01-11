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
    params.bot.audioQueue = playlistOut;
    let mem = params.interaction.member;
    params.bot.guild.channels.cache
      .get(params.bot.defaultTextChannel.id)
      .send(`${mem} Playlist has been shuffled!`);
  },
};
function shuffle(arr) {
  let arrOut = [];
  let finalLength = arr.length;
  while (arrOut.length < finalLength) {
    let index = Math.floor(Math.random() * arr.length);
    arrOut.push(arr.splice(index)[0]);
  }
  return arr;
}
