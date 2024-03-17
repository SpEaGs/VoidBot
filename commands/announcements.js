//Announcements command. Lets the user opt in or out of the announcements role on the server they use this command in (if enabled)

const utils = require("../utils.js");
const { SlashCommandBuilder } = require("discord.js");

let name = "Announcements";
let description =
  "Opt in or out of announcements on this server if it is enabled";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description)
    .addStringOption((option) =>
      option
        .setName("action")
        .setDescription("opt in or out")
        .setRequired(true)
        .addChoices({ name: "in", value: "in" }, { name: "out", value: "out" })
    ),
  name: name,
  description: description,
  args: false,
  usage: `\`/announcements <in/out>\``,
  admin: false,
  botadmin: false,
  server: false,
  execute(params) {
    if (!params.WS)
      params.interaction.reply({
        content: "Command received!",
        ephemeral: true,
      });
    let mem = params.interaction.member;
    let action = params.interaction.options.getString("action");
    switch (action) {
      case "in": {
        mem.roles.add(
          utils.config.sharding[params.bot.guildID].announcementsRole.id
        );
        return params.WS
          ? params.bot.guild.channels.cache
              .get(params.bot.defaultTextChannel.id)
              .send(
                `${mem} You've successfully opted IN to ${params.bot.guildName} announcements!`
              )
          : params.interaction.editReply({
              content: `${mem} You've successfully opted  IN to ${params.bot.guildName} announcements!`,
            });
      }
      case "out": {
        mem.roles.remove(
          utils.config.sharding[params.bot.guildID].announcementsRole.id
        );
        return params.WS
          ? params.bot.guild.channels.cache
              .get(params.bot.defaultTextChannel.id)
              .send(
                `${mem} You've successfully opted OUT of ${params.bot.guildName} announcements!`
              )
          : params.interaction.editReply({
              content: `${mem} You've successfully opted OUT of ${params.bot.guildName} announcements!`,
            });
      }
    }
  },
};
