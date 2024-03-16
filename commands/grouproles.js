//group role command. returns a dropdown that users can use to select one or multiple
//group roles to apply to themselves.
const {
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");

const utils = require("../utils.js");

const name = "Grouproles";
const description = "Command to add or remove group roles.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description)
    .addStringOption((option) =>
      option
        .setRequired(true)
        .setName("action")
        .setDescription("add or remove")
        .addChoices(
          { name: "add", value: "add" },
          { name: "remove", value: "rem" }
        )
    ),
  name: name,
  description: description,
  args: false,
  usage: `\`/grouproles\``,
  admin: false,
  botadmin: false,
  server: true,
  async execute(params) {
    const action = params.interaction.options.getString("action") === "add";
    const roleOptions = params.bot.groupRoles
      .map((r) => {
        role = utils.findIDRoleFromGuild(r, params.bot.guild);
        const rOption = new StringSelectMenuOptionBuilder()
          .setLabel(role.name)
          .setValue(role.id);
        if (action)
          return !params.interaction.member.roles.cache.find(
            (ro) => ro.id === role.id
          )
            ? rOption
            : null;
        else
          return !!params.interaction.member.roles.cache.find(
            (ro) => ro.id === role.id
          )
            ? rOption
            : null;
      })
      .filter((i) => !!i);
    const roleMenu = new StringSelectMenuBuilder()
      .setCustomId("grouproles")
      .setPlaceholder("Select your desired group roles:")
      .setMinValues(1)
      .setMaxValues(roleOptions.length)
      .addOptions(...roleOptions);
    const roleRow = new ActionRowBuilder().addComponents(roleMenu);

    const res = await params.interaction.reply({
      content: "select-roles",
      components: [roleRow],
    });

    try {
      const rolesSelected = await res.awaitMessageComponent();
      const rolesToAction = rolesSelected.values.map((role) => {
        return utils.findIDRoleFromGuild(role, params.bot.guild);
      });
      if (action) {
        params.interaction.member.roles.add(rolesToAction);
      } else {
        params.interaction.member.roles.remove(rolesToAction);
      }
      params.interaction.editReply({
        content: `Successfully ${action ? "added" : "removed"} selected roles!`,
        components: [],
      });
    } catch (e) {
      console.log(e);
      await params.interaction.editReply({
        content: "No roles selected within one minute. Canceling changes.",
        components: [],
      });
    }
  },
};
