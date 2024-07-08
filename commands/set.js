const utils = require("../utils");
const config = require("../cfg.js");
const { SlashCommandBuilder, ChannelType } = require("discord.js");

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
            .addChannelTypes(ChannelType.GuildText)
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
            .addChannelTypes(ChannelType.GuildVoice)
        )
    )
    //welcomeMessage
    .addSubcommand((subcommand) =>
      subcommand
        .setName("welcomemessage")
        .setDescription("Turns on or off the welcome message.")
        .addBooleanOption((option) =>
          option.setName("state").setDescription("on or off")
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
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    //newMember
    .addSubcommand((subcommand) =>
      subcommand
        .setName("newmember")
        .setDescription("Turns on or off giving new members a default role.")
        .addBooleanOption((option) =>
          option.setName("state").setDescription("on or off.")
        )
    )
    //newMemberRole
    .addSubcommand((subcommand) =>
      subcommand
        .setName("newmemberrole")
        .setDescription("Sets the role to be given to new members.")
        .addRoleOption((option) =>
          option.setName("role").setDescription("The role to be given.")
        )
    )
    //announcements
    .addSubcommand((subcommand) =>
      subcommand
        .setName("announcements")
        .setDescription("Turns on or off giving the announcements role.")
        .addBooleanOption((option) =>
          option.setName("state").setDescription("on or off")
        )
    )
    //announcementsRole
    .addSubcommand((subcommand) =>
      subcommand
        .setName("announcementsrole")
        .setDescription(
          "Sets the role to be given when opting in or out of announcements."
        )
        .addRoleOption((option) =>
          option.setName("role").setDescription("The role to be given.")
        )
    )
    //ruleTextChannel
    .addSubcommand((subcommand) =>
      subcommand
        .setName("ruletextchannel")
        .setDescription("Sets the text channel used for server rules.")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("The text channel to set.")
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    //groupRoles
    .addSubcommand((subcommand) =>
      subcommand
        .setName("grouprole")
        .setDescription("toggles given role from the group role list")
        .addRoleOption((option) =>
          option.setName("role").setDescription("The role to toggle")
        )
    ),
  name: name,
  description: description,
  args: true,
  usage: `\`/set <setting> <value>\``,
  admin: true,
  botadmin: false,
  server: true,
  async execute(params) {
    if (!params.WS)
      await params.interaction.reply({
        content: "Command received!",
        ephemeral: true,
      });
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
    switch (params.interaction.options.getSubcommand()) {
      case "defaulttextchannel": {
        toReply = !!chan
          ? `Set the default text channel to: \`${channel.name}\``
          : `Current default text channel: \`${
              utils.findChanFromGuild(
                params.bot.defaultTextChannel.name,
                params.bot
              ).name
            }\``;
        params.bot.defaultTextChannel = !!chan
          ? chan
          : params.bot.defaultTextChannel;
        break;
      }
      case "defaultvoicechannel": {
        toReply = !!chan
          ? `Set the default voice channel to: \`${channel.name}\``
          : `Current default voice channel: \`${
              utils.findChanFromGuild(
                params.bot.defaultVoiceChannel.name,
                params.bot
              ).name
            }\``;
        params.bot.defaultVoiceChannel = !!chan
          ? chan
          : params.bot.defaultVoiceChannel;
        break;
      }
      case "welcomemessage": {
        toReply =
          state !== undefined
            ? `Set the welcome message to: \`${
                state ? "`On (True)`" : "`Off (False)`"
              }\``
            : `Welcome message is: ${
                params.bot.welcomeMsg ? "`On (True)`" : "`Off (False)`"
              }`;
        params.bot.welcomeMsg =
          state !== undefined ? state : params.bot.welcomeMsg;
        break;
      }
      case "welcometextchannel": {
        toReply = !!chan
          ? `Set the welcome text channel to: \`${channel.name}\``
          : `Current welcome text channel: \`${
              utils.findChanFromGuild(params.bot.welcomeTextChannel, params.bot)
                .name
            }\``;
        params.bot.welcomeTextChannel = !!chan
          ? chan
          : params.bot.welcomeTextChannel;
        break;
      }
      case "newmember": {
        toReply =
          state !== undefined
            ? `Set new member role dispensing to: \`${
                state ? "`On (True)`" : "`Off (False)`"
              }\``
            : `New member roles are: ${
                params.bot.newMember ? "`On (True)`" : "`Off (False)`"
              }`;
        params.bot.newMember =
          state !== undefined ? state : params.bot.newMember;
        break;
      }
      case "newmemberrole": {
        toReply = !!ro
          ? `Set the new member role to: \`${ro.name}\``
          : `New member role: \`${
              !!params.bot.newMemberRole
                ? params.bot.newMemberRole.name
                : "not set"
            }\``;
        params.bot.newMemberRole = !!ro ? ro : params.bot.newMemberRole;
        break;
      }
      case "announcements": {
        toReply =
          state !== undefined
            ? `Set announcements to: \`${state}\``
            : `Announcement are: ${
                params.bot.announcements ? "`On (True)`" : "`Off (False)`"
              }`;
        params.bot.announcements =
          state !== undefined ? state : params.bot.announcements;
        break;
      }
      case "announcementsrole": {
        toReply = !!ro
          ? `Set the announcements role to: \`${ro.name}\``
          : `Announcements role: \`${
              !!params.bot.announcementsRole
                ? params.bot.announcementsRole.name
                : "not set"
            }\``;
        params.bot.announcementsRole = !!ro ? ro : params.bot.announcementsRole;
        break;
      }
      case "ruletextchannel": {
        toReply = !!chan
          ? `Set the rule text channel to: \`${channel.name}\``
          : `Current rule text channel: \`${
              utils.findChanFromGuild(params.bot.ruleTextChannel, params.bot)
                .name
            }\``;
        params.bot.ruleTextChannel = !!chan ? chan : params.bot.ruleTextChannel;
        break;
      }
      case "grouprole": {
        toReply = !!ro
          ? `Toggled the role \`${ro.name}\` from the group roles list`
          : `Current group roles: ${params.bot.groupRoles
              .map((ri) => {
                return `\`[${
                  utils.findIDRoleFromGuild(ri, params.bot.guild).name
                }]\``;
              })
              .join(", ")}`;
        if (!!ro) {
          let i = params.bot.groupRoles.indexOf(ro.id);
          if (i + 1 > 0) {
            params.bot.groupRoles.splice(i, 1);
          } else params.bot.groupRoles.push(ro.id);
        }
      }
    }
    await params.interaction.editReply({ content: toReply });
    config.save(params.bot);
    utils.informAdminClients(params.bot, {
      defaultTextChannel: params.bot.defaultTextChannel,
      defaultVoiceChannel: params.bot.defaultVoiceChannel,
      welcomeMsg: params.bot.welcomeMsg,
      welcomeTextChannel: params.bot.welcomeTextChannel,
      newMember: params.bot.newMember,
      newMemberRole: params.bot.newMemberRole,
      announcements: params.bot.announcements,
      announcementsRole: params.bot.announcementsRole,
      ruleTextChannel: params.bot.ruleTextChannel,
    });
  },
};
