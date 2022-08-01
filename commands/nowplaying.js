//Now Playing command. Lists info about the currently playing audio.

const utils = require("../utils.js");
const prefix = utils.config.prefix;

let name = "Nowplaying";
let description = "Lists info about the currently playing audio.";

module.exports = {
  name: name,
  description: description,
  alias: ["np"],
  args: false,
  usage: `\`${prefix}nowplaying\``,
  admin: false,
  botadmin: false,
  server: true,
  execute(params) {
    const nP = params.bot.nowPlaying;
    let mem = params.msg.member;
    if (!params.bot.nowPlaying) {
      try {
        return params.msg.reply("I'm not playing anything you scrub!");
      } catch {
        return params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(`${mem} I'm not playing anything you scrub!`);
      }
    }
    try {
      return params.msg.reply(
        `Now Playing: \`${nP.videoDetails.title} [${parseInt(
          nP.videoDetails.lengthSeconds / 60
        )}:${(nP.videoDetails.lengthSeconds % 60)
          .toString()
          .padStart(2, "0")}}] (added by: ${nP.added_by})\`\nURL: ${nP.url}`
      );
    } catch {
      return params.bot.guild.channels.cache
        .get(params.bot.defaultTextChannel.id)
        .send(
          `${mem} Now Playing: \`${nP.videoDetails.title} [${parseInt(
            nP.videoDetails.lengthSeconds / 60
          )}:${(nP.videoDetails.lengthSeconds % 60)
            .toString()
            .padStart(2, "0")}}] (added by: ${nP.added_by})\`\nURL: ${nP.url}`
        );
    }
  },
  regJSON: {
    name: name,
    description: description,
  },
};
