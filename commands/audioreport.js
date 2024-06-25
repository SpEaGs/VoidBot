//Audio Report command. Gets some statistics about the bot's audio activities.

const { SlashCommandBuilder } = require("discord.js");
const CacheFile = require("../models/cachefile");
const { client } = require("../main");

const name = "Audioreport";
const description = "Gets some statistics about the bot's audio activities.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description),
  name: name,
  description: description,
  args: false,
  usage: `\`/audioreport\``,
  admin: true,
  botadmin: false,
  server: true,
  async execute(params) {
    if (!params.WS)
      params.interaction.reply({
        content: "Command received!",
        ephemeral: true,
      });
    const log = global.log;
    CacheFile.find({}).then((audioCache) => {
      let mostPlay = [],
        mostPlaySinceLastReport = [],
        userCount = {};
      audioCache.forEach((cf) => {
        if (cf.stats.addedBy === "") cf.stats.addedBy = client.user.id;
        if (!!userCount[cf.stats.addedBy]) userCount[cf.stats.addedBy] += 1;
        else userCount[cf.stats.addedBy] = 1;
        if (
          mostPlay.length > 0 &&
          mostPlay[0].stats.timesPlayed < cf.stats.timesPlayed
        )
          mostPlay = [cf];
        else if (
          mostPlay.length > 0 &&
          mostPlay[0].stats.timesPlayed === cf.stats.timesPlayed
        )
          mostPlay.push(cf);
        else if (mostPlay.length === 0) mostPlay.push(cf);
        if (
          mostPlaySinceLastReport.length > 0 &&
          mostPlaySinceLastReport[0].stats.timesPlayedSinceLastReport <
            cf.stats.timesPlayedSinceLastReport
        )
          mostPlaySinceLastReport = [cf];
        else if (
          mostPlaySinceLastReport.length > 0 &&
          mostPlaySinceLastReport[0].stats.timesPlayedSinceLastReport ===
            cf.stats.timesPlayedSinceLastReport
        )
          mostPlaySinceLastReport.push(cf);
        else if (mostPlaySinceLastReport.length === 0)
          mostPlaySinceLastReport = [cf];
      });
      let mostAdded = [];
      Object.keys(userCount).forEach((k) => {
        if (mostAdded.length === 0) mostAdded.push(k);
        else if (userCount[mostAdded[0]] < userCount[k]) mostAdded = [k];
        else if (userCount[mostAdded[0]] === userCount[k]) mostAdded.push(k);
      });
      client.children.forEach((child) => {
        if (!!child.defaultTextChannel) {
          toSend =
            `An audio stats report was requested. Here we go!:` +
            `\nServer plays since last report: ${child.audioStats.playsSinceLastReport}` +
            `\nMost played file(s) since last report: ${
              mostPlaySinceLastReport.length > 1
                ? mostPlaySinceLastReport
                    .map((play) => {
                      return play.title;
                    })
                    .slice(0, 3)
                    .join(", ")
                : mostPlaySinceLastReport[0].title
            }\n-Played ${
              mostPlaySinceLastReport[0].stats.playsSinceLastReport
            }` +
            `\nAll time total plays: ${child.audioStats.plays}` +
            `\nAll time most played file(s): ${
              mostPlay.length > 1
                ? mostPlay
                    .map((play) => {
                      return play.title;
                    })
                    .slice(0, 3)
                    .join(", ")
                : mostPlay[0].title
            }\n-Played ${mostPlay[0].stats.plays}` +
            `\nAll time most files added by: ${
              mostAdded.length > 1
                ? mostAdded
                    .map((add) => {
                      return child.guild.members.cache.get(add)
                        ? `@${add}`
                        : "User not in this server";
                    })
                    .slice(0, 3)
                    .join(", ")
                : child.guild.members.cache.get(mostAdded[0])
                ? `@${mostAdded[0]}`
                : "User not in this server"
            }`;
          log(toSend.length, ["[WARN]", "[audioreport]"]);
          //client.channels.cache.get(child.defaultTextChannel.id).send();
        }
      });
      audioCache.forEach(async (f) => {
        f.stats.timesPlayedSinceLastReport = 0;
        f.markModified("stats");
        await f.save();
      });
    });
  },
};
