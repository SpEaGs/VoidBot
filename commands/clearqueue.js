//Clear Queue command. Clears the active audio queue.

const { SlashCommandBuilder } = require("discord.js");

const name = "Clearqueue";
const description =
  "Clears the active audio queue without interrupting what is playing.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description),
  name: name,
  description: description,
  args: false,
  useage: `\`/clearqueue\``,
  admin: false,
  botadmin: false,
  server: true,
  execute(params) {
    if (!params.WS) params.interaction.reply({ content: "Command received!" });
    if (params.bot.audioQueue && params.bot.audioQueue.length > 0) {
      params.bot.audioQueue = false;
      return params.WS
        ? params.bot.guild.channels.cache
            .get(params.bot.defaultTextChannel.id)
            .send("Cleared audio queue.")
        : params.interaction.editReply({ content: "Cleared audio queue." });
    } else
      return params.WS
        ? params.bot.guild.channels.cache
            .get(params.bot.defaultTextChannel.id)
            .send("There is nothing in queue...")
        : params.interaction.editReply({
            content: "There is nothing in queue...",
          });
  },
};
