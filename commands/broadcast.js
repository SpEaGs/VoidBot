//Broadcast command. Sends a given message the default text channel of all servers the bot is in.

const status = require("../main.js");
const { SlashCommandBuilder } = require("discord.js");

let name = "Broadcast";
let description = "Sends a given message to all servers the bot is in.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description)
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("The message to broadcast.")
        .setRequired(true)
    ),
  name: name,
  description: description,
  args: true,
  usage: `\`/broadcast <message>\``,
  admin: false,
  botadmin: true,
  server: true,
  execute(params) {
    let client = status.client;
    let message = "";
    if (params.WS) message = params.interaction.args.message;
    else message = params.interaction.options.getString("message");
    client.children.forEach((bot) => {
      if (!!bot.defaultTextChannel) {
        client.channels.cache
          .get(bot.defaultTextChannel.id)
          .send(`[BOT AUTHOR BROADCAST] ${message}`);
      }
    });
  },
};
