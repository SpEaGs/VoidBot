//Now Playing command. Lists info about the currently playing audio.

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
  usage: `\`/nowplaying\``,
  admin: false,
  botadmin: false,
  server: true,
  execute(params) {
    if (!params.WS) params.interaction.reply({ content: "Command received!" });
    const nP = params.bot.nowPlaying;
    let mem = params.interaction.member;
    if (!params.bot.nowPlaying) {
      return params.WS
        ? params.bot.guild.channels.cache
            .get(params.bot.defaultTextChannel.id)
            .send(`${mem} I'm not playing anything you scrub!`)
        : params.interaction.editReply({
            content: `${mem} I'm not playing anything you scrub!`,
          });
    }
    return params.WS
      ? params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(
            `${mem} Now Playing: \`${nP.title} [${parseInt(
              nP.duration / 60
            )}:${(nP.duration % 60).toString().padStart(2, "0")}] (added by: ${
              nP.added_by
            })\`\nURL: ${nP.url}`
          )
      : params.interaction.editReply({
          content: `${mem} Now Playing: \`${nP.title} [${parseInt(
            nP.duration / 60
          )}:${(nP.duration % 60).toString().padStart(2, "0")}] (added by: ${
            nP.added_by
          })\`\nURL: ${nP.url}`,
        });
  },
};
