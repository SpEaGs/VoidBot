//WebUI command. Sends a link to the Bot's WebUI dashboard.

const utils = require("../utils.js");
const webURL = utils.config.webURL;
const { SlashCommandBuilder } = require("discord.js");

let name = "Webui";
let description = "Sends a link to the WebUI page.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description),
  name: name,
  description: description,
  args: false,
  usage: `\`/webui\``,
  admin: false,
  botadmin: false,
  server: true,
  execute(params) {
    let mem = params.interaction.member;
    params.bot.guild.channels.cache
      .get(params.bot.defaultTextChannel.id)
      .send(`${mem} The web UI can be found here: http://${webURL}`);
  },
};
