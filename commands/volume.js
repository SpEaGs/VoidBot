//Volume command. Alters the bot's audio stream volume to the given value.

const utils = require("../utils.js");
const prefix = utils.config.prefix;
const { SlashCommandBuilder } = require("discord.js");

let name = "Volume";
let description = "Alters the bot's volume to the given value.";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description)
    .addStringOption((option) =>
      option
        .setName("number")
        .setDescription("The number to set the volume to.")
        .setRequired(true)
    ),
  name: name,
  description: description,
  args: true,
  usage: `\`${prefix}volume <0-100>\``,
  admin: false,
  botadmin: false,
  server: true,
  execute(params) {
    const regex = /\ud83d\udcaf/;
    let mem = params.interaction.member;
    let number = params.interaction.options.getString("number");
    let log = global.log;
    if (regex.test(number)) {
      returnVolume(100, params, true);
      return;
    } else {
      try {
        returnVolume(number, params, false);
      } catch (error) {
        params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(
            `${mem} ${number} is not valid, scrub! Try again!\n Usage: ${this.usage}`
          );
        log(`Error updating volume:\n${error}`, ["[ERR]", "[VOLUME]"]);
      }
    }
  },
};

function returnVolume(volume = "", params, regBool) {
  let returnMsg = "";
  let mem = params.interaction.member;
  switch (volume[0]) {
    case "+": {
      let volMod = volume.replace("+", "");
      let newVol = params.bot.defaultVolume + parseInt(volMod);
      if (newVol > 100) {
        newVol = 100;
      }
      params.bot.defaultVolume = parseInt(newVol);
      break;
    }
    case "-": {
      let volMod = volume.replace("-", "");
      let newVol = params.bot.defaultVolume - parseInt(volMod);
      if (newVol < 0) {
        newVol = 0;
      }
      params.bot.defaultVolume = parseInt(newVol);
      break;
    }
  }
  if (volume[0] != "+" && volume[0] != "-") {
    if (volume > 100) {
      volume = 100;
    }
    params.bot.defaultVolume = parseInt(volume);
  }
  if (regBool) {
    returnMsg = `Set the current volume to :100:`;
  } else {
    returnMsg = `Set the current volume to ${params.bot.defaultVolume}%.`;
  }
  if (params.bot.dispatcher != false)
    params.bot.dispatcher.setVolume(parseFloat(params.bot.defaultVolume / 100));
  params.bot.guild.channels.cache
    .get(params.bot.defaultTextChannel.id)
    .send(`${mem} ${returnMsg}`);
  utils.saveConfig(params.bot);
  utils.informClients(params.bot, { defaultVolume: params.bot.defaultVolume });
}
