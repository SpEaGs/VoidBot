//Role command. adds/removes given role from given user

const utils = require("../utils.js");
const {
  SlashCommandBuilder,
  RoleSelectMenuBuilder,
  ActionRowBuilder,
} = require("discord.js");

let name = "Role";
let description =
  "Adds/Removes a(the) given role(s) from a given user. Admin only.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to add or remove roles from.")
        .setRequired(true)
    ),
  name: name,
  description: description,
  args: true,
  usage: `\`/role <add/remove> <user> <role>\``,
  admin: true,
  botadmin: true,
  server: true,
  async execute(params) {
    const target = params.interaction.options.getMember("user");
    const targetRoleDefaults = target.roles.cache.map((role) => {
      return role.id;
    });
    const roleMenu = new RoleSelectMenuBuilder()
      .setCustomId("roles")
      .setPlaceholder(`Select desired roles for ${target.name}`)
      .setMinValues(1)
      .setMaxValues(Array.from(params.bot.guild.roles.cache).length)
      .addDefaultRoles(targetRoleDefaults);
    const roleRow = new ActionRowBuilder().addComponents(roleMenu);

    const res = await params.interaction.reply({
      content: "select-roles",
      components: [roleRow],
      ephemeral: true,
    });

    try {
      const rolesSelected = await res.awaitMessageComponent();
      params.interaction.member.roles.set(rolesSelected.values);
      params.interaction.editReply({
        content: `Successfully updated roles for ${target}`,
        components: [],
      });
    } catch (e) {
      console.log(e);
      params.interaction.editReply({
        content: "Command timed out or there was an error",
        components: [],
      });
    }
  },
};
