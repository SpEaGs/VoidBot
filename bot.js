const Discord = require("discord.js");
const EventEmitter = require("events");

const utils = require("./utils.js");
const config = require("./cfg.js");
const token = require("./tokens.json").TOKEN;

const { log, warn, err } = require("./logger.js");

class Bot extends EventEmitter {
  constructor(guild, status) {
    super();
    //init base vars
    this.guild = guild;
    this.status = status;
    this.fs = require("fs");
    log(`Bot Initializing...`, ["[BOT]", `[${this.guild.name}]`]);

    //load stored config defaults & load shard specific config on top
    //this should automatically update any existing config with new entries
    //that are added to the defaults
    const loadConfig = () => {
      let configOut = config.sharding.default;
      if (!config.sharding[this.guild.id]) {
        config.sharding[this.guild.id] = { ...configOut };
      }
      return {
        ...configOut,
        ...config.sharding[this.guild.id],
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
    config.sharding[this.guild.id].guildName = this.guild.name;

    if (!config.sharding[this.guild.id].audioStats)
      config.sharding[this.guild.id].audioStats = this.audioStats;

    //save config & clear disconnected websockets at intervals: 5min
    config.save(this);
    setInterval(() => {
      config.save(this);
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
