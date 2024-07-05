const utils = require("../utils.js");
const config = require("../cfg.js");
const {
  SlashCommandBuilder,
  StringSelectMenuOptionBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
} = require("discord.js");

const { log, warn, err } = require("../logger");

let name = "Botadmin";
let description = "Provides various subcommands for bot admin.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description)
    .addSubcommand((subcommand) =>
      subcommand.setName("togglecmd").setDescription("Toggles a given command")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("refreshcmds")
        .setDescription("Refresh the command list")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("refreshadmin")
        .setDescription("Refresh the admin lists")
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("kill").setDescription("Kill the bot.")
    ),
  name: name,
  description: description,
  args: true,
  usage: `\`/botadmin <command> <args>`,
  admin: false,
  botadmin: true,
  server: true,
  async execute(params) {
    if (!params.WS)
      await params.interaction.reply({
        content: "Command received!",
        ephemeral: true,
      });
    switch (params.interaction.options.getSubcommand()) {
      case "togglecmd": {
        const chunkedChoices = {};
        let chunk = 0;
        config.cmdToggles.forEach((i) => {
          if (!chunkedChoices[`p${chunk}`])
            chunkedChoices[`p${chunk}`] = new Array();
          warn(JSON.stringify(chunkedChoices, null, 2), ["[BOTADMIN]"]);
          chunkedChoices[`p${chunk}`].push(
            new StringSelectMenuOptionBuilder()
              .setLabel(`${i.name} ${i.state ? "(enabled)" : "(disabled)"}`)
              .setValue(i.name)
          );
          if (chunkedChoices[`p${chunk}`].length == 25) chunk += 1;
        });

        const menus = [];
        Object.values(chunkedChoices).forEach((chnk, i) => {
          menus.push(
            new StringSelectMenuBuilder()
              .setCustomId("cmd")
              .setPlaceholder(`Select a command to toggle.(page ${i + 1}`)
              .addOptions(...chnk)
          );
        });
        const cmdRow = new ActionRowBuilder().addComponents(...menus);
        const res = await params.interaction.editReply({
          content: "",
          components: [cmdRow],
        });
        try {
          const cmdSelected = await res.awaitMessageComponent({ time: 60_000 })
            .values[0];
          params.interaction.editReply({
            content: `Toggling ${cmdSelected}`,
            components: [],
          });
          warn(`Toggling command: ${cmdSelected}`, ["[BOTADMIN]"]);
          toggleBool(
            config.cmdToggles.find((i) => i.name === cmdSelected).state
          );
          return config.save();
        } catch (e) {
          warn(e, ["[INTERACTION]"]);
          await params.interaction.editReply({
            content: "No command selected within one minute. Canceling...",
            components: [],
          });
        }
      }
      case "refreshcmds": {
        return utils.populateCmds(params.bot.status);
      }
      case "refreshadmin": {
        params.bot.status.client.children.forEach((bot) => {
          utils.populateAdmin(bot);
        });
        return;
      }
      case "kill": {
        params.bot.status.client.destroy();
        return process.exit(0);
      }
    }
  },
};

function toggleBool(bool) {
  bool = !bool;
  return bool;
}
