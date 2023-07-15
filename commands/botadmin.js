const utils = require("../utils.js");
const { SlashCommandBuilder } = require("discord.js");

let name = "Botadmin";
let description = "Provides various subcommands for bot admin.";

const cmdChoices = utils.config.cmdToggles.map((i) => {
  return { name: i.name, value: i.name };
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description)
    /*.addSubcommand((subcommand) => {
      subcommand
        .setName("togglecmd")
        .setDescription("Toggles a given command")
        .addStringOption((option) => {
          option
            .setName("command")
            .setDescription("Command to toggle")
            .setRequired(true);
          cmdChoices.forEach((i) => {
            option.addChoices(i);
          });
        });
    })*/
    .addSubcommand((subcommand) => {
      subcommand
        .setName("refreshcmds")
        .setDescription("Refresh the command list");
    })
    .addSubcommand((subcommand) => {
      subcommand
        .setName("refreshadmin")
        .setDescription("Refresh the admin lists");
    })
    .addSubcommand((subcommand) => {
      subcommand.setName("kill").setDescription("Kill the bot.");
    }),
  name: name,
  description: description,
  args: true,
  usage: `\`/botadmin <command> <args>`,
  admin: false,
  botadmin: true,
  server: true,
  async execute(params) {
    await params.interaction.followUp({ content: "test", ephemeral: true });
    let log = global.log;
    let cmd = params.interaction.options.getString("command");
    switch (params.interaction.options.getSubcommand()) {
      /*case "togglecmd": {
        log(`Toggling command: ${cmd}`, ["[WARN]", "[BOTADMIN]"]);
        toggleBool(utils.config.cmdToggles.find((i) => i.name === cmd).state);
        return utils.dumpJSON("../config.json", utils.config, 2);
      }*/
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
