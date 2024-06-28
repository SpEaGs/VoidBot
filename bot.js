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
    this.fs = require("fs");
    log(`Bot Initializing...`, ["[INFO]", "[BOT]", `[${this.guild.name}]`]);

    //load stored config defaults & load shard specific config on top
    //this should automatically update any existing config with new entries
    //that are added to the defaults
    const loadConfig = () => {
      let configOut = utils.config.sharding.default;
      if (!utils.config.sharding[this.guild.id]) {
        utils.config.sharding[this.guild.id] = { ...configOut };
      }
      return {
        ...configOut,
        ...utils.config.sharding[this.guild.id],
        guildName: undefined,
      };
    };

    //init bot vars
    Object.assign(this, loadConfig());
    this.visAdminRoles = new Discord.Collection();
    this.voiceStateTimeouts = new Discord.Collection();
    this.socketSubs = new Discord.Collection();
    this.adminSocketSubs = new Discord.Collection();
    this.dispatcher = false;
    this.voiceChannel = false;
    this.voiceChannelArray = [];
    this.voiceConnection = false;
    this.textChannelArray = [];
    this.roleArray = [];
    this.audioQueue = [];
    this.nowPlaying = false;
    this.audioStats = {
      plays: 0,
      mostPlayedAllTime: "",
      userMostAdded: "",
      mostPlayedSinceLastReport: "",
      playsSinceLastReport: 0,
    };

    //update config object with current guild name (guild name can change at any
    //time while the ID is always the same)
    utils.config.sharding[this.guild.id].guildName = this.guild.name;

    if (!utils.config.sharding[this.guild.id].audioStats)
      utils.config.sharding[this.guild.id].audioStats = this.audioStats;

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
