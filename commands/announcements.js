//Announcements command. Lets the user opt in or out of the announcements role on the server they use this command in (if enabled)

const utils = require("../utils.js");
const prefix = utils.config.prefix;

let name = "Announcements";
let description =
  "Use this to opt in or out of announcements on this server if it is enabled";

module.exports = {
  name: name,
  description: description,
  alias: ["anno"],
  args: false,
  usage: `\`${prefix}announcements <in/out>\``,
  admin: false,
  botadmin: false,
  server: false,
  execute(params) {
    let log = global.log;
    let mem = params.msg.member;
    if (!params.args.length) {
      try {
        return params.msg.reply(
          `You need to opt in or out.\nUsage: ${this.usage}`
        );
      } catch {
        return params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(`${mem} You need to opt in or out.\nUsage: ${this.usage}`);
      }
    } else if (params.args.length >= 1) {
      switch (params.args[0].toLowerCase()) {
        case "in": {
          mem.roles.add(
            utils.config.sharding[params.bot.guildID].announcementsRole.id
          );
          try {
            return params.msg.reply(
              `You've successfully opted IN to ${params.bot.guildName} announcements!`
            );
          } catch {
            return params.bot.guild.channels.cache
              .get(params.bot.defaultTextChannel.id)
              .send(
                `${mem} You've successfully opted IN to ${params.bot.guildName} announcements!`
              );
          }
        }
        case "out": {
          mem.roles.remove(
            utils.config.sharding[params.bot.guildID].announcementsRole.id
          );
          try {
            return params.msg.reply(
              `You've successfully opted OUT of ${params.bot.guildName} announcements!`
            );
          } catch {
            return params.bot.guild.channels.cache
              .get(params.bot.defaultTextChannel.id)
              .send(
                `${mem} You've successfully opted OUT of ${params.bot.guildName} announcements!`
              );
          }
        }
      }
    }
  },
  regJSON: {
    name: name,
    description: description,
    options: [
      {
        name: "action",
        description: "opt in or out",
        type: 3,
        required: true,
        choices: [
          { name: "in", value: "in" },
          { name: "out", value: "out" },
        ],
      },
    ],
  },
};
