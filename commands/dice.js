//dice command. Rolls a die of a given number of sides (max 100), the given number of times (max 10).

const { SlashCommandBuilder } = require("discord.js");

let name = "Dice";
let description = "Rolls a die with any number of sides, up to 10 times";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description)
    .addIntegerOption((option) =>
      option
        .setName("sides")
        .setDescription("Number of sides the die will have. (2-100)")
        .setRequired(true)
        .setMinValue(2)
        .setMaxValue(100)
    )
    .addIntegerOption((option) =>
      option
        .setName("rolls")
        .setDescription("Number of times to roll the die. (1-10)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(10)
    )
    .addStringOption((option) =>
      option
        .setName("modifier")
        .setDescription("Modifier for the roll")
        .setRequired(false)
        .addChoices(
          { name: "advantage", value: "adv" },
          { name: "disadvantage", value: "dis" }
        )
    ),
  name: name,
  description: description,
  args: false,
  usage: `\`/dice <sides> <rolls>\``,
  admin: false,
  botadmin: false,
  server: false,
  async execute(params) {
    if (!params.WS)
      await params.interaction.reply({ content: "Command received!" });
    let mem = params.interaction.member;
    let sides = params.interaction.options.getInteger("sides");
    let rolls = params.interaction.options.getInteger("rolls");
    let mod = params.interaction.options.getString("modifier");

    let i = rolls;

    const roll = () => {
      let dataOut = { rolls: [], total: 0 };
      while (i > 0) {
        i--;
        let ro = Math.round(Math.random() * sides);
        dataOut.total += ro;
        dataOut.rolls.push(ro);
        if (i === 0) return dataOut;
      }
    };
    let reply = ``;
    if (!!mod) {
      switch (mod) {
        case "adv": {
          const roll1 = roll();
          const roll2 = roll();
          reply = `${mem} Rolled ${rolls} d${sides} with advantage.\nResult: ${
            rolls > 1
              ? `[${roll1.rolls.join(", ")}] (total: ${roll1.total})`
              : roll1.rolls[0]
          } and ${
            rolls > 1
              ? `[${roll2.rolls.join(", ")}] (total: ${roll2.total})`
              : roll2.rolls[0]
          }\nYour advantage gives you a final roll of ${
            roll1.total >= roll2.total ? roll1.total : roll2.total
          }`;
        }
        case "dis": {
          const roll1 = roll();
          const roll2 = roll();
          reply = `${mem} Rolled ${rolls} d${sides} with disadvantage.\nResult: ${
            rolls > 1
              ? `[${roll1.rolls.join(", ")}] (total: ${roll1.total})`
              : roll1.rolls[0]
          } and ${
            rolls > 1
              ? `[${roll2.rolls.join(", ")}] (total: ${roll2.total})`
              : roll2.rolls[0]
          }\nYour disadvantage gives you a final roll of ${
            roll1.total <= roll2.total ? roll1.total : roll2.total
          }`;
        }
      }
    } else {
      const roll1 = roll();
      reply = `${mem} Rolled ${rolls} d${sides}\nResult: ${
        rolls > 1
          ? `${roll1.rolls.join(" ")} (total: ${roll1.total})`
          : roll1.rolls[0]
      }`;
    }

    return params.WS
      ? params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(reply)
      : params.interaction.editReply({
          content: reply,
        });
  },
};
