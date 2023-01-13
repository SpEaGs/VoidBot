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
    params.bot.audioQueue = shuffle(params.bot.audioQueue);
    let mem = params.interaction.member;
    params.bot.guild.channels.cache
      .get(params.bot.defaultTextChannel.id)
      .send(`${mem} Playlist has been shuffled!`);
  },
};
function shuffle(arr) {
  let arrIn = arr.slice(0);
  let arrOut = [];
  let finalLength = parseInt(JSON.stringify(arrIn.length));
  while (arrOut.length < finalLength) {
    let index = Math.floor(Math.random() * arr.length);
    arrOut.push(arr.splice(index, 1));
  }
  utils.dumpJSON("temp.json", arrOut, 2);
  return arrOut;
}
