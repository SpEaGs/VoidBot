//help command. Displays a list of commands. If given a command name as an arg, displays that command's
//description and usage.

const config = require("../cfg.js");
const {
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
} = require("discord.js");

const { log, warn, err } = require("../logger.js");

let name = "Help";
let description =
  "Displays a list of commands, or a given command's description and usage.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description),
  name: name,
  description: description,
  args: false,
  usage: `\`/help <command>\``,
  admin: false,
  botadmin: false,
  server: false,
  async execute(params) {
    if (!params.WS)
      await params.interaction.reply({
        content: "Command received!",
        ephemeral: true,
      });
    const chunkedChoices = [];
    let chunk = 0;
    params.bot.status.client.cmds.forEach((c) => {
      if (!chunkedChoices[chunk]) chunkedChoices[chunk] = [];
      chunkedChoices[chunk].push(
        new StringSelectMenuOptionBuilder()
          .setLabel(`/${c.name.toLowerCase()}`)
          .setValue(c.name.toLowerCase())
      );
      if (chunkedChoices[chunk].length == 25) chunk++;
    });
    chunkedChoices[chunkedChoices.length - 1].push(
      new StringSelectMenuOptionBuilder().setLabel("all").setValue("*")
    );
    const cmdRows = chunkedChoices.map((chnk, i) => {
      return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`cmd${i + 1}`)
          .setPlaceholder(`Select a command (page ${i + 1})`)
          .addOptions(...chnk)
      );
    });
    const res = await params.interaction.editReply({
      content: `All commands are listed in these menus. Select one to get help with.\nYou can select "all" at the bottom of the last page to get help with every command.\n(Note that some commands are only accessible to those with admin permissions)`,
      components: cmdRows,
    });
    try {
      const selected = await res.awaitMessageComponent({ time: 120_000 });
      const sel = selected.values[0];
      if (sel === "*") {
        const uChunks = [];
        let uchunk = 0;
        params.bot.status.client.cmds.forEach((c) => {
          if (!uChunks[uchunk]) uChunks[uchunk] = "";
          uChunks[
            uchunk
          ] += `\`/${c.name}\`:\n    Usage: ${c.usage}\n    ${c.description}`;
          if (uChunks[uchunk].length >= 1750) uchunk++;
        });
        const usageAll = params.bot.status.client.cmds
          .map((c) => {
            return `\`/${c.name}\`:\n    Usage: ${c.usage}\n    ${c.description}`;
          })
          .join(`\n\n`);
        if (uChunks.length > 1) {
          await params.interaction.editReply({
            content: uChunks[0],
            components: [],
          });
          let counter = 1;
          uChunks.forEach(async (ch, i) => {
            if (i === counter) await params.interaction.followUp(ch);
            counter++;
          });
          return;
        } else
          return await params.interaction.editReply({
            content: uChunks,
            components: [],
          });
      } else {
        const cmd = params.bot.status.client.cmds.get(sel);
        return await params.interaction.editReply({
          content: `\`${cmd.name}\`:\nUsage: ${cmd.usage}\n${cmd.description}`,
          components: [],
        });
      }
    } catch (e) {
      warn(e, ["[INTERACTION]"]);
      return await params.interaction.editReply({
        content: `Canceled. No option was selected within two minutes.`,
        components: [],
      });
    }
  },
};
