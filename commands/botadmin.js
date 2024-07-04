const utils = require("../utils.js");
const config = require("../cfg.js");
const { SlashCommandBuilder } = require("discord.js");

const { log, warn, err } = require("../logger");

let name = "Botadmin";
let description = "Provides various subcommands for bot admin.";

const cmdChoices = config.cmdToggles.map((i) => {
  return { name: i.name, value: i.name };
});

warn(JSON.stringify(cmdChoices).length, ["[BOTADMIN]"]);

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("togglecmd")
        .setDescription("Toggles a given command")
        .addStringOption((option) =>
          option
            .setName("command")
            .setDescription("Command to toggle")
            .setRequired(true)
            .addChoices(...cmdChoices)
        )
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
    let cmd = params.interaction.options.getString("command");
    switch (params.interaction.options.getSubcommand()) {
      case "togglecmd": {
        warn(`Toggling command: ${cmd}`, ["[BOTADMIN]"]);
        toggleBool(config.cmdToggles.find((i) => i.name === cmd).state);
        return config.save();
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
