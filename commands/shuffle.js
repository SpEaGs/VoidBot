//Shuffle command. Shuffles the active playlist

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
  usage: `\`/shuffle\``,
  admin: false,
  botadmin: false,
  server: true,
  execute(params) {
    if (!params.WS) params.interaction.reply({ content: "Command received!" });
    if (!params.bot.audioQueue.length)
      return params.WS
        ? params.bot.guild.channels.cache
            .get(params.bot.defaultTextChannel.id)
            .send(`${mem} There's nothing in the queue to shuffle...`)
        : params.interaction.editReply({
            content: `${mem} There's nothing in the queue to shuffle...`,
          });
    params.bot.audioQueue = shuffle(params.bot.audioQueue);
    let mem = params.interaction.member;
    params.WS
      ? params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(`${mem} Playlist has been shuffled!`)
      : params.interaction.editReply({
          content: `${mem} Playlist has been shuffled!`,
        });
  },
};
function shuffle(arr) {
  let arrIn = arr.slice(0);
  let arrOut = [];
  let finalLength = parseInt(JSON.stringify(arrIn.length));
  while (arrOut.length < finalLength) {
    let index = Math.floor(Math.random() * arr.length);
    arrOut.push(arr.splice(index, 1)[0]);
  }
  return arrOut;
}
