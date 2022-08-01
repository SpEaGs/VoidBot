//Broadcast command. Sends a given message the default text channel of all servers the bot is in.

const utils = require("../utils.js");
const { regJSON } = require("./announcements.js");
const prefix = utils.config.prefix;

let name = "Broadcast";
let description = "Sends a given message to all servers the bot is in.";

module.exports = {
  name: name,
  description: description,
  alias: [],
  args: true,
  usage: `\`${prefix}broadcast <message>\``,
  admin: false,
  botadmin: true,
  server: true,
  execute(params) {
    let client = params.bot.status.client;
    let toSend = params.args.join(" ");
    for (let bot of client.children.array()) {
      client.channels.cache
        .get(bot.defaultTextChannel.id)
        .send(`[BOT AUTHOR BROADCAST] ${toSend}`);
    }
  },
  regJSON: {
    name: name,
    description: description,
    options: [
      {
        name: "message",
        description: "the message to broadcast",
        type: 3,
        required: true,
      },
    ],
  },
};
