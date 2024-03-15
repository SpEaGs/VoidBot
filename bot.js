const Discord = require("discord.js");
const EventEmitter = require("events");

const utils = require("./utils.js");
const token = require("./tokens.json").TOKEN;

class Bot extends EventEmitter {
  constructor(guild, status) {
    super();
    //init base vars
    let log = global.log;
    this.guild = guild;
    this.status = status;
    this.guildID = this.guild.id;
    this.guildName = this.guild.name;
    this.fs = require("fs");
    log(`Bot Initializing...`, ["[INFO]", "[BOT]", `[${this.guildName}]`]);

    //load stored config defaults & load shard specific config on top
    //this should automatically update any existing config with new entries
    //that are added to the defaults
    const loadConfig = () => {
      let configOut = utils.config.sharding.default;
      if (!utils.config.sharding[this.guildID]) {
        utils.config.sharding[this.guildID] = { ...configOut };
      }
      return { ...configOut, ...utils.config.sharding[this.guildID] };
    };
    const configShard = loadConfig();

    //init bot vars
    Object.assign(this, configShard);
    this.visAdminRoles = new Discord.Collection();
    this.dispatcher = false;
    this.voiceChannel = false;
    this.voiceChannelArray = [];
    this.voiceConnection = false;
    this.textChannelArray = [];
    this.audioQueue = [];
    this.nowPlaying = false;

    //update config object with current guild name (guild name can change at any
    //time while the ID is always the same)
    utils.config.sharding[this.guildID].guildName = this.guildName;

    //save config & clear disconnected websockets at intervals: 5min
    utils.saveConfig(this);
    setInterval(() => {
      utils.saveConfig(this);
      this.socketSubs.forEach((s) => {
        if (!s.connected) this.socketSubs.delete(s.id);
      });
      this.adminSocketSubs.forEach((as) => {
        if (!as.connected) this.adminSocketSubs.delete(as.id);
      });
    }, 1000 * 60 * 5);
  }
}

module.exports = {
  Bot: Bot,
};
