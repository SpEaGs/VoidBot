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
        .setDescription("Number of sides the die/dice will have. (2-100)")
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
    ),
  name: name,
  description: description,
  args: false,
  usage: `\`/dice <sides> <rolls>\``,
  admin: false,
  botadmin: false,
  server: false,
  async execute(params) {
    let sides = params.interaction.getInteger("sides");
    let rolls = params.interaction.getInteger("rolls");
    let i = 0;
    let rollsOut = [];
    let total;
    while (i <= rolls) {
      i++;
      let roll = Math.round(Math.random() * sides);
      total += roll;
      rollsOut.push(roll);
    }
    return await params.interaction.followUp(
      `Rolled ${rolls} d${sides}\nResult: ${rollsOut.join(" ")} total: ${total}`
    );
  },
};
