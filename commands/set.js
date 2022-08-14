const utils = require("../utils");
const prefix = utils.config.prefix;
const { SlashCommandBuilder } = require("discord.js");

let name = "Set";
let description = "Sets given bot settings to the given values. Admin only.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description)
    //defaultTextChannel
    .addSubcommand((subcommand) =>
      subcommand
        .setName("defaulttextchannel")
        .setDescription("Sets the default text channel.")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("The text channel to set.")
            .setRequired(true)
            .addChannelTypes([0])
        )
    )
    //defaultVoiceChannel
    .addSubcommand((subcommand) =>
      subcommand
        .setName("defaultvoicechannel")
        .setDescription("Sets the default voice channel.")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("The voice channel to set.")
            .setRequired(true)
            .addChannelTypes([2])
        )
    )
    //welcomeMessage
    .addSubcommand((subcommand) =>
      subcommand
        .setName("welcomemessage")
        .setDescription("Turns on or off the welcome message.")
        .addBooleanOption((option) =>
          option.setName("state").setDescription("on or off").setRequired(true)
        )
    )
    //welcomeTextChannel
    .addSubcommand((subcommand) =>
      subcommand
        .setName("welcometextchannel")
        .setDescription("Sets the text channel for welcome messages")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("The text channel to set.")
            .setRequired(true)
            .addChannelTypes([0])
        )
    )
    //newMember
    .addSubcommand((subcommand) =>
      subcommand
        .setName("newmember")
        .setDescription("Turns on or off giving new members a default role.")
        .addBooleanOption((option) =>
          option.setName("state").setDescription("on or off.").setRequired(true)
        )
    )
    //newMemberRole
    .addSubcommand((subcommand) =>
      subcommand
        .setName("newmemberrole")
        .setDescription("Sets the role to be given to new members.")
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("The role to be given.")
            .setRequired(true)
        )
    )
    //announcements
    .addSubCommand((subcommand) =>
      subcommand
        .setName("announcements")
        .setDescription("Turns on or off giving the announcements role.")
        .addBooleanOption((option) =>
          option.setName("state").setDescription("on or off").setRequired(true)
        )
    )
    //announcementsRole
    .addSubCommand((subcommand) =>
      subcommand
        .setName("announcementsrole")
        .setDescription(
          "Sets the role to be given when opting in or out of announcements."
        )
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDecription("The role to be given.")
            .setRequired(true)
        )
    )
    //ruleTextChannel
    .addSubCommand((subcommand) =>
      subcommand
        .setName("ruletextchannel")
        .setDecription("Sets the text channel used for server rules.")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDecription("The text channel to set.")
            .setRequired(true)
            .addChannelTypes([0])
        )
    ),
  name: name,
  description: description,
  args: true,
  usage: `\`${prefix}set <setting> <value>\``,
  admin: true,
  botadmin: false,
  server: true,
  execute(params) {
    let log = global.log;
    let channel = params.interaction.options.getChannel("channel");
    let chan;
    if (!!channel) {
      chan = {
        id: channel.id,
        name: channel.name,
        cName: utils.cleanChannelName(channel.name),
      };
    }
    let role = params.interaction.options.getRole("role");
    let ro;
    if (!!role) {
      ro = {
        id: role.id,
        name: role.name,
        cName: utils.cleanChannelName(role.name),
      };
    }
    let state = params.interaction.options.getBoolean("state");
    let toReply = "";
    switch (params.interaction.options.getSubCommand()) {
      case "defaulttextchannel": {
        toReply = `Set the default text channel to: \`${chan.name}\``;
        params.bot.defaultTextChannel = chan;
        break;
      }
      case "defaultvoicechannel": {
        toReply = `Set the default voice channel to: \`${chan.name}\``;
        params.bot.defaultVoiceChannel = chan;
        break;
      }
      case "welcomemessage": {
        toReply = `Set the welcome message to: \`${state}\``;
        params.bot.welcomeMsg = state;
        break;
      }
      case "welcometextchannel": {
        toReply = `Set the welcome text channel to: \`${chan.name}\``;
        params.bot.welcomeTextChannel = chan;
        break;
      }
      case "newmember": {
        toReply = `Set new member role dispensing to: \`${state}\``;
        params.bot.newMember = state;
        break;
      }
      case "newmemberrole": {
        toReply = `Set the new member role to: \`${ro.name}\``;
        params.bot.newMemberRole = ro;
        break;
      }
      case "announcements": {
        toReply = `Set announcements to: \`${state}\``;
        params.bot.announcements = state;
        break;
      }
      case "announcementsrole": {
        toReply = `Set the announcements role to: \`${ro.name}\``;
        params.bot.announcementsRole = ro;
        break;
      }
      case "ruletextchannel": {
        toReply = `Set the rule text channel to: \`${chan.name}\``;
        params.bot.ruleTextChannel = chan;
        break;
      }
    }
    params.interaction.reply({ content: toReply, ephemeral: true });
    utils.saveConfig(params.bot);
  },
};
