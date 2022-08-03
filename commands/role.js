//Role command. adds/removes given role from given user

const utils = require("../utils.js");
const prefix = utils.config.prefix;
const { SlashCommandBuilder } = require("discord.js");

let name = "Role";
let description =
  "Adds/Removes a(the) given role(s) from a given user. Admin only.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name)
    .setDescription(description)
    .addStringOption((option) =>
      option
        .setName("action")
        .setDescription("Add or remove.")
        .setRequired(true)
        .addChoices(
          { name: "add", value: "add" },
          { name: "remove", value: "remove" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("user")
        .setDescription("The user to add or remove roles from.")
        .setRequire(true)
    )
    .addStringOption((option) =>
      option
        .setName("roles")
        .setDescription("The roles to be added or removed to/from the user.")
        .setRequired(true)
    ),
  name: name,
  description: description,
  alias: false,
  args: true,
  usage: `\`${prefix}role <add/remove> <user> <role>\``,
  admin: true,
  botadmin: true,
  server: true,
  execute(params) {
    let msgmem = params.msg.member;
    switch (params.args[0]) {
      case "add": {
        mem = utils.findMemberFromGuild(params.args[1], params.bot.guild);
        if (!mem) {
          try {
            return params.msg.reply("User not found!");
          } catch {
            return params.bot.guild.channels.cache
              .get(params.bot.defaultTextChannel.id)
              .send(`${msgmem} User not found!`);
          }
        }
        if (params.args.length > 3) {
          var rolesToFind = params.args.splice(2, params.args.length - 2);
          var roles = [];
          for (const name of rolesToFind) {
            var roleToAdd = utils.findRoleFromGuild(name, params.bot.guild);
            if (!roleToAdd === false) {
              roles.splice(roles.length, 0, roleToAdd);
            }
          }
          var rolenames = [];
          for (const r of roles) {
            rolenames.splice(rolenames.length, 0, r.name);
          }
          try {
            params.msg.reply(
              `Adding roles: \`${rolenames}\`\n to User: \`${mem.user.username}\``
            );
          } catch {
            params.bot.guild.channels.cache
              .get(params.bot.defaultTextChannel.id)
              .send(
                `${msgmem} Adding roles: \`${rolenames}\`\n to User: \`${mem.user.username}\``
              );
          }
          add(mem, roles);
        } else {
          var role = utils.findRoleFromGuild(params.args[2], params.bot.guild);
          if (!role === false) {
            try {
              params.msg.reply(
                `Adding role: \`${role.name}\`\n to User: \`${mem.user.username}\``
              );
            } catch {
              params.bot.guild.channels.cache
                .get(params.bot.defaultTextChannel.id)
                .send(
                  `${msgmem} Adding role: \`${role.name}\`\n to User: \`${mem.user.username}\``
                );
            }
            add(mem, role);
          } else {
            try {
              return params.msg.reply("Role not found!");
            } catch {
              return params.bot.guild.channels.cache
                .get(params.bot.defaultTextChannel.id)
                .send(`${msgmem} Role not found!`);
            }
          }
        }
        break;
      }
      case "remove": {
        mem = utils.findMemberFromGuild(params.args[1], params.bot.guild);
        if (!mem) {
          try {
            return params.msg.reply("User not found!");
          } catch {
            return params.bot.guild.channels.cache
              .get(params.bot.defaultTextChannel.id)
              .send(`${msgmem} User not found!`);
          }
        }
        if (params.args.length > 3) {
          var rolesToFind = params.args.splice(2, params.args.length - 2);
          var roles = [];
          for (const name of rolesToFind) {
            var roleToRem = utils.findRoleFromGuild(name, params.bot.guild);
            if (!roleToRem === false) {
              roles.splice(roles.length, 0, roleToRem);
            }
          }
          var rolenames = [];
          for (const r of roles) {
            rolenames.splice(rolenames.length, 0, r.name);
          }
          try {
            params.msg.reply(
              `Removing roles: \`${rolenames}\`\n from User: \`${mem.user.username}\``
            );
          } catch {
            params.bot.guild.channels.cache
              .get(params.bot.defaultTextChannel.id)
              .send(
                `${msgmem} Removing roles: \`${rolenames}\`\n from User: \`${mem.user.username}\``
              );
          }
          rem(mem, roles);
        } else {
          var role = utils.findRoleFromGuild(params.args[2], params.bot.guild);
          if (!role === false) {
            try {
              params.msg.reply(
                `Removing role: \`${role.name}\` from user \`${mem.user.username}\``
              );
            } catch {
              params.bot.guild.channels.cache
                .get(params.bot.defaultTextChannel.id)
                .send(
                  `${msgmem} Removing role: \`${role.name}\` from user \`${mem.user.username}\``
                );
            }
            rem(mem, role);
          } else {
            try {
              return params.msg.reply("Role not found!");
            } catch {
              return params.bot.guild.channels.cache
                .get(params.bot.defaultTextChannel.id)
                .send(`${msgmem} Role not found!`);
            }
          }
        }
        break;
      }
    }
  },
};

function add(mem, roleRes) {
  mem.roles.add(roleRes);
}

function rem(mem, roleRes) {
  mem.roles.remove(roleRes);
}
