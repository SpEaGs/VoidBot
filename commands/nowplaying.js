//Now Playing command. Lists info about the currently playing audio.

const utils = require("../utils.js");
const prefix = utils.config.prefix;
const { SlashCommandBuilder } = require("discord.js");

let name = "Nowplaying";
let description = "Lists info about the currently playing audio.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description),
  name: name,
  description: description,
  args: false,
  usage: `\`${prefix}nowplaying\``,
  admin: false,
  botadmin: false,
  server: true,
  execute(params) {
    const nP = params.bot.nowPlaying;
    let mem = params.interaction.member;
    if (!params.bot.nowPlaying) {
      return params.bot.guild.channels.cache
        .get(params.bot.defaultTextChannel.id)
        .send(`${mem} I'm not playing anything you scrub!`);
    }
    return params.bot.guild.channels.cache
      .get(params.bot.defaultTextChannel.id)
      .send(
        `${mem} Now Playing: \`${nP.videoDetails.title} [${parseInt(
          nP.videoDetails.lengthSeconds / 60
        )}:${(nP.videoDetails.lengthSeconds % 60)
          .toString()
          .padStart(2, "0")}}] (added by: ${nP.added_by})\`\nURL: ${nP.url}`
      );
  },
};
