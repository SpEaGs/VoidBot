//Prune command. Deletes given number of messages from the channel in which the command was sent.

const utils = require("../utils.js");
const prefix = utils.config.prefix;
const { SlashCommandBuilder } = require("discord.js");

let name = "Prune";
let description =
  "Prunes given number of messages from the given channel. Admin only.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description)
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("The number of messages to prune.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("channel")
        .setDescription("The text channel to prune.")
        .setRequired(true)
    ),
  name: name,
  description: description,
  alias: false,
  args: true,
  usage: `\`${prefix}prune {amount} {channel}\``,
  admin: true,
  botadmin: false,
  server: true,
  execute(params) {
    let mem = params.msg.member;
    if (params.args.length < 2) {
      try {
        return params.msg.reply("Please specify the channel to prune.");
      } catch {
        return params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(`${mem} Please specify the channel to prune.`);
      }
    }
    const amount = parseInt(params.args[0]);
    const chan = utils.findChanFromGuild(params.args[1], params.bot.guild);
    if (isNaN(amount)) {
      try {
        return params.msg.reply("That's not a real number scrub!");
      } catch {
        return params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(`${mem} That's not a real number scrub!`);
      }
    }
    if (!chan) {
      try {
        return params.msg.reply("That channel doesn't exist you egg!");
      } catch {
        return params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(`${mem} That channel doesn't exist you egg!`);
      }
    }
    var caseCheck = 0;
    if (amount >= 2 && amount <= 100) caseCheck = 2;
    else if (amount > 100) caseCheck = 3;
    else caseCheck = amount;

    switch (caseCheck) {
      case 0: {
        try {
          return params.msg.reply("H... Hokay... deleting 0 messages then...");
        } catch {
          return params.bot.guild.channels.cache
            .get(params.bot.defaultTextChannel.id)
            .send(`${mem} H... Hokay... deleting 0 messages then...`);
        }
      }
      case 1: {
        try {
          return params.msg.reply(
            "Pruning currently only works for 2 or more messages."
          );
        } catch {
          return params.bot.guild.channels.cache
            .get(params.bot.defaultTextChannel.id)
            .send(
              `${mem} Pruning currently only works for 2 or more messages.`
            );
        }
      }
      case 2:
        chan.bulkDelete(amount + 1, true).catch((err) => {
          console.error(err);
          try {
            return params.msg.reply(
              "Pruning error. Likely that all applicable messages are too (2 weeks) old."
            );
          } catch {
            return params.bot.guild.channels.cache
              .get(params.bot.defaultTextChannel.id)
              .send(
                `${mem} Pruning error. Likely that all applicable messages are too (2 weeks) old.`
              );
          }
        });
        try {
          return params.msg.reply(
            `Pruned ${amount} messages from ${chan.name}`
          );
        } catch {
          return params.bot.guild.channels.cache
            .get(params.bot.defaultTextChannel.id)
            .send(`${mem} Pruned ${amount} messages from ${chan.name}`);
        }
      case 3: {
        try {
          return params.msg.reply(
            "For reasons unfathomable, I can't prune more than 100 messages."
          );
        } catch {
          return params.bot.guild.channels.cache
            .get(params.bot.defaultTextChannel.id)
            .send(
              `${mem} For reasons unfathomable, I can\'t prune more than 100 messages.`
            );
        }
      }
    }
  },
};
