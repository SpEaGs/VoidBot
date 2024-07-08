//Wrongsong command. Used to remove a song from the queue.

const { log, warn, err } = require("../logger.js");

const utils = require("../utils.js");
const {
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
} = require("discord.js");

let name = "Wrongsong";
let description = "Removes the selected song from the first 25 songs in queue.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description),
  name: name,
  description: description,
  args: false,
  usage: `\`/wrongsong <number/np>\``,
  admin: false,
  botadmin: false,
  server: true,
  async execute(params) {
    const mem = params.interaction.member;
    if (params.WS) {
      const index = params.interaction.args.number - 1;
      const title = params.bot.audioQueue[index].info.title;
      params.bot.audioQueue.splice(index, 1);
      utils.informClients(params.bot, { audioQueue: params.bot.audioQueue });
      return params.bot.guild.channels.cache
        .get(params.bot.defaultTextChannel.id)
        .send(`${mem} Removed \`${title}\` from the queue.`);
    } else {
      await params.interaction.reply({ content: "Command received!" });
      const truncQueue = params.bot.audioQueue.slice(0, 25);
      const songRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("song")
          .setPlaceholder("Select a song from the first 25 in the queue")
          .addOptions(
            ...truncQueue.map((qi) => {
              return new StringSelectMenuOptionBuilder()
                .setLabel(qi.info.title)
                .setValue(qi.info.title);
            })
          )
      );
      const res = await params.interaction.editReply({
        content: "",
        components: [songRow],
      });
      try {
        const selected = await res.awaitMessageComponent({ time: 60_000 });
        const title = selected.values[0];
        const index = params.bot.audioQueue.findIndex(
          (song) => song.info.title === title
        );
        params.bot.audioQueue.splice(index, 1);
        utils.informClients(params.bot, { audioQueue: params.bot.audioQueue });
        return await params.interaction.editReply({
          content: `Removed \`${title}\` from the queue.`,
        });
      } catch (e) {
        warn(e, ["[INTERACTION]"]);
        return await params.interaction.editReply({
          content: "No song selected within one minute. Canceling...",
          components: [],
        });
      }
    }
  },
};
