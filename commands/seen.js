//Seen command. Gets when a user was last seen
const utils = require("../utils.js");
const prefix = utils.config.prefix;
const status = require("../main.js");
const { SlashCommandBuilder } = require("discord.js");

let name = "Seen";
let description = "Gets how long ago a user was last online/active.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description)
    .addStringOption((option) =>
      option
        .setName("user")
        .setDescription("The user to find.")
        .setRequired(true)
    ),
  name: name,
  description: description,
  args: true,
  usage: `\`${prefix}seen <user to find>\``,
  admin: false,
  botadmin: false,
  server: true,
  execute(params) {
    let mem = params.interaction.member;
    let user = params.interaction.options.getString("user");
    let target = utils.findMemberFromGuild(user, params.bot.guild);
    if (!target) {
      return params.bot.guild.channels.cache
        .get(params.bot.defaultTextChannel.id)
        .send(`${mem} I couldn't find that member.`);
    }
    let timeDiff = utils.getTimeRaw() - status.client.lastSeen[target.id];
    let seen = utils.msToTime(timeDiff);
    if (!target.presence) {
      return params.bot.guild.channels.cache
        .get(params.bot.defaultTextChannel.id)
        .send(`${mem} That user is offline and was last seen ${seen} ago.`);
    }
    switch (target.presence.status) {
      case "online": {
        return params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(`${mem} That user is online right now you fool!`);
      }
      case "idle": {
        return params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(
            `${mem} That user is AFK/Idle and was last active ${seen} ago.`
          );
      }
      case "dnd": {
        return params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(
            `${mem} That user is set to Do not Disturb and was last available ${seen} ago.`
          );
      }
    }
  },
};
