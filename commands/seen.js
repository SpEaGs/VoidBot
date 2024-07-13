//Seen command. Gets when a user was last seen
const utils = require("../utils.js");
const { SlashCommandBuilder } = require("discord.js");
const { getTimeRaw } = require("../logger.js");

let name = "Seen";
let description = "Gets how long ago a user was last online/active.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to find.")
        .setRequired(true)
    ),
  name: name,
  description: description,
  args: true,
  usage: `\`/seen <user to find>\``,
  admin: false,
  botadmin: false,
  server: true,
  async execute(params) {
    if (!params.WS)
      await params.interaction.reply({ content: "Command received!" });
    let mem = params.interaction.member;
    let target = params.bot.guild.members.cache.find(
      (u) => u.id === params.interaction.options.getUser("user").id
    );
    let timeDiff = getTimeRaw() - params.bot.status.client.lastSeen[target.id];
    let seen = `${utils.msToTime(timeDiff)} ago`;
    if (seen < 0) {
      seen = `sometime before the last restart of this bot.`;
    }
    switch (target.presence.status) {
      case "online": {
        let res = `${mem} That user is online right now you fool!`;
        return params.WS
          ? params.bot.guild.channels.cache
              .get(params.bot.defaultTextChannel.id)
              .send(res)
          : params.interaction.editReply({
              content: res,
            });
      }
      case "idle": {
        let res = `${mem} That user is AFK/Idle and was last active ${seen}.`;
        return params.WS
          ? params.bot.guild.channels.cache
              .get(params.bot.defaultTextChannel.id)
              .send(res)
          : params.interaction.editReply({
              content: res,
            });
      }
      case "dnd": {
        let res = `${mem} That user is set to Do not Disturb and was last available ${seen}.`;
        return params.WS
          ? params.bot.guild.channels.cache
              .get(params.bot.defaultTextChannel.id)
              .send(res)
          : params.interaction.editReply({
              content: res,
            });
      }
      case "offline": {
        let res = `${mem} That user is Offline/Invisible and was last seen ${seen}.`;
        return params.WS
          ? params.bot.guilds.channels.cache
              .get(params.bot.defaultTextChannel.id)
              .send(res)
          : params.interaction.editReply({
              content: res,
            });
      }
    }
  },
};
