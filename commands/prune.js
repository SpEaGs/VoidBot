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
  args: true,
  usage: `\`${prefix}prune {amount} {channel}\``,
  admin: true,
  botadmin: false,
  server: true,
  execute(params) {
    let mem = params.interaction.member;
    const amount = params.interaction.options.getInteger("amount");
    const chan = utils.findChanFromGuild(
      params.interaction.options.getString("channel"),
      params.bot.guild
    );
    if (isNaN(amount)) {
      return params.bot.guild.channels.cache
        .get(params.bot.defaultTextChannel.id)
        .send(`${mem} That's not a real number scrub!`);
    }
    if (!chan) {
      return params.bot.guild.channels.cache
        .get(params.bot.defaultTextChannel.id)
        .send(`${mem} That channel doesn't exist you egg!`);
    }
    var caseCheck = 0;
    if (amount >= 2 && amount <= 100) caseCheck = 2;
    else if (amount > 100) caseCheck = 3;
    else caseCheck = amount;

    switch (caseCheck) {
      case 0: {
        return params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(`${mem} H... Hokay... deleting 0 messages then...`);
      }
      case 1: {
        return params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(`${mem} Pruning currently only works for 2 or more messages.`);
      }
      case 2:
        chan.bulkDelete(amount + 1, true).catch((err) => {
          console.error(err);
          return params.bot.guild.channels.cache
            .get(params.bot.defaultTextChannel.id)
            .send(
              `${mem} Pruning error. Likely that all applicable messages are too (2 weeks) old.`
            );
        });
        return params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(`${mem} Pruned ${amount} messages from ${chan.name}`);

      case 3: {
        return params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(
            `${mem} For reasons unfathomable, I can\'t prune more than 100 messages.`
          );
      }
    }
  },
};
