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
    .setDescription(description),
  name: name,
  description: description,
  args: false,
  usage: `\`/grouproles\``,
  admin: false,
  botadmin: false,
  server: true,
  async execute(params) {
    const roleOptions = params.bot.groupRoles.map((r) => {
      role = utils.findIDRoleFromGuild(r, params.bot.guild);
      const rOption = new StringSelectMenuOptionBuilder()
        .setLabel(role.name)
        .setValue(role.id);
      return !!params.interaction.member.roles.cache.find(
        (ro) => ro.id === role.id
      )
        ? rOption
        : undefined;
    });
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

    const collectorFilter = (i) => i.user.id === params.interaction.user.id;

    try {
      const rolesSelected = await res.awaitMessageComponent({
        filter: collectorFilter,
      });
    } catch {
      await params.interaction.editReply({
        content: "No roles selected within one minute. Canceling changes.",
        components: [],
      });
    }
  },
};
