//Queue command. Lists all entries in the audio queue.

const { SlashCommandBuilder } = require("discord.js");

let name = "Queue";
let description = "Lists all entries in audio queue.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description),
  name: name,
  description: description,
  args: false,
  usage: `\`queue\``,
  admin: false,
  botadmin: false,
  server: true,
  execute(params) {
    var output = [];
    var i = 0;
    let mem = params.interaction.member;
    if (params.bot.audioQueue.length == 0) {
      return params.bot.guild.channels.cache
        .get(params.bot.defaultTextChannel.id)
        .send(`${mem} The queue is empty.`);
    }
    for (const item of params.bot.audioQueue) {
      i += 1;
      output.push(
        `${i}) - \`${item.title} [${parseInt(item.duration / 60)}:${(
          item.duration % 60
        )
          .toString()
          .padStart(2, "0")}] (added by: ${item.added_by})\``
      );
      if (output.length === 10) {
        params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(output.join("\n"));
        output = [];
        if (i === params.bot.audioQueue.length) return;
      }
    }
    return params.bot.guild.channels.cache
      .get(params.bot.defaultTextChannel.id)
      .send(output.join("\n"));
  },
};
