//Welcome command. sends a welcome message for the given user in the same channel as the command

const utils = require("../utils.js");
const prefix = utils.config.prefix;

let name = "Welcome";
let description = "Sends a welcome message for the given user.";

module.exports = {
  name: name,
  description: description,
  alias: [],
  args: true,
  usage: `\`${prefix}welcome <user>\``,
  admin: false,
  botadmin: false,
  server: true,
  execute(params) {
    arg = params.args.join(" ");
    let anno = false;
    let welcomeChannel = params.bot.guild.channels.cache.get(
      params.bot.welcomeTextChannel.id
    );
    if (params.bot.announcementsRole != false) anno = true;
    if (params.bot.ruleTextChannel != false) {
      welcomeChannel.send(
        utils.welcome(utils.findMemberFromGuild(arg, params.bot.guild), anno) +
          `\nPlease read the rules in ${params.bot.guild.channels.cache
            .get(params.bot.ruleTextChannel.id)
            .toString()}`
      );
    } else {
      welcomeChannel.send(
        utils.welcome(utils.findMemberFromGuild(arg, params.bot.guild), anno)
      );
    }
  },
  regJSON: {
    name: name,
    description: description,
    options: [
      {
        name: "user",
        description: "User to welcome.",
        type: 3,
        required: true,
      },
    ],
  },
};
