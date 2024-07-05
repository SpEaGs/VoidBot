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
        const chunkedChoices = [];
        let chunk = 0;
        config.cmdToggles.forEach((i) => {
          if (!chunkedChoices[chunk]) chunkedChoices[chunk] = new Array();
          chunkedChoices[chunk].push(
            new StringSelectMenuOptionBuilder()
              .setLabel(`${i.name} ${i.state ? "(enabled)" : "(disabled)"}`)
              .setValue(i.name)
          );
          if (chunkedChoices[chunk].length == 25) chunk += 1;
        });

        const cmdRows = chunkedChoices.map((chnk, i) => {
          return new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(`cmd${i + 1}`)
              .setPlaceholder(`Select a command to toggle. (page ${i + 1})`)
              .addOptions(...chnk)
          );
        });
        const res = await params.interaction.editReply({
          content: "",
          components: cmdRows,
        });
        try {
          const cmdSelected = await res.awaitMessageComponent({ time: 60_000 });
          const cmd = cmdSelected.values[0];
          warn(config.cmdToggles.find((i) => i.name === cmd));
          warn(`Toggling command: ${cmd}`, ["[BOTADMIN]"]);
          toggleBool(config.cmdToggles.find((i) => i.name === cmd).state);
          params.interaction.editReply({
            content: `Toggling ${cmd}`,
            components: [],
          });
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
