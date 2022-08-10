//Role command. adds/removes given role from given user

const utils = require("../utils.js");
const prefix = utils.config.prefix;
const { SlashCommandBuilder } = require("discord.js");

let name = "Role";
let description =
  "Adds/Removes a(the) given role(s) from a given user. Admin only.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
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
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("roles")
        .setDescription("The roles to be added or removed to/from the user.")
        .setRequired(true)
    ),
  name: name,
  description: description,
  args: true,
  usage: `\`${prefix}role <add/remove> <user> <role>\``,
  admin: true,
  botadmin: true,
  server: true,
  execute(params) {
    let mem = params.interaction.member;
    let action = params.interaction.options.getString("action");
    let user = params.interaction.options.getString("user");
    let roles = params.interaction.options.getString("roles").split(" ");
    let guildMem = utils.findMemberFromGuild(user, params.bot.guild);
    if (!guildMem) {
      return params.bot.guild.channels.cache
        .get(params.bot.defaultTextChannel.id)
        .send(`${mem} That user wasn't found!`);
    }
    let notFound = [];
    let rolesToAction = roles.map((r) => {
      let toReturn = utils.findRoleFromGuild(r, params.bot.guild);
      console.log(toReturn);
      if (!toReturn) {
        notFound.push(r);
        return;
      } else return toReturn;
    });
    switch (action) {
      case "add": {
        params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(
            `${mem} Adding role(s): \`${rolesToAction.join(
              " "
            )}\`\n to User: \`${mem.user.username}\``
          );
        guildMem.roles.add(rolesToAction);
        break;
      }
      case "remove": {
        params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(
            `${mem} Removing roles: \`${rolesToAction.join(
              " "
            )}\`\n from User: \`${mem.user.username}\``
          );
        guildMem.roles.remove(rolesToAction);
        break;
      }
    }
    if (notFound.length > 0) {
      params.bot.guild.channels.cache
        .get(params.bot.defaultTextChannel.id)
        .send(
          `${mem} These roles were not found: \`${notFound.join("`, `")}\``
        );
    }
  },
};
