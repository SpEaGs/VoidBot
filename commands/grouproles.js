//group role command. returns a dropdown that users can use to select one or multiple
//group roles to apply to themselves.
const {
  SlashCommandBuilder,
  RoleSelectMenuBuilder,
  ActionRowBuilder,
} = require("discord.js");

const utils = require("../utils.js");

const name = "Grouproles";
const description = "Command to add or remove group roles.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description),
  name: name,
  description: description,
  args: false,
  usage: `\`/grouproles\``,
  admin: false,
  botadmin: false,
  server: true,
  async execute(params) {
    const roleMenu = new RoleSelectMenuBuilder()
      .setCustomId("grouproles")
      .setPlaceholder("Select your desired group roles:")
      .setMinValues(1)
      .setMaxValues(20)
      .setDefaultRoles(params.bot.groupRoles);
    const roleRow = new ActionRowBuilder().addComponents(roleMenu);

    const res = await params.interaction.reply({
      content: "select-roles",
      components: [roleRow],
    });

    const collectorFilter = (i) => i.user.id === params.interaction.user.id;

    try {
      const rolesSelected = await res.awaitMessageComponent({
        filter: collectorFilter,
        time: 60_00,
      });
    } catch {
      await params.interaction.editReply({
        content: "No roles selected within one minute. Canceling changes.",
        components: [],
      });
    }
  },
};
