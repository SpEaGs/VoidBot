const Discord = require("discord.js");
const EventEmitter = require("events");

const utils = require("./utils.js");
const token = require("./tokens.json").TOKEN;

class Bot extends EventEmitter {
  constructor(guildID, status) {
    super();
    //init bot's vars
    let log = global.log;
    this.guild = status.client.guilds.fetch(guildID);
    this.status = status;
    this.guildID = this.guild.id;
    this.guildName = this.guild.name;
    this.fs = require("fs");
    this.visAdminRoles = new Discord.Collection();
    this.dispatcher = false;
    this.voiceChannel = false;
    this.defaultVoiceChannel = false;
    this.defaultVolume = 0;
    this.voiceChannelArray = [];
    this.voiceConnection = false;
    this.audioQueue = [];
    this.nowPlaying = false;
    this.announcements = false;
    this.announcementsRole = false;
    this.newMember = false;
    this.newMemberRole = false;
    this.defaultTextChannel = false;
    this.welcomeMsg = false;
    this.welcomeTextChannel = false;
    this.ruleTextChannel = false;
    this.textChannelArray = [];
    this.roleArray = [];
    this.voiceStateCaching = {
      members: [],
      timeouts: {},
    };
    this.socketSubs = [];
    this.adminSocketSubs = [];

    //login
    log(`Bot Initializing...`, ["[INFO]", "[BOT]", `[${this.guildName}]`]);
    //this.client.login(token);

    //check for previously saved config & create from defaults if not found
    if (!utils.config.sharding[this.guildID])
      utils.config.sharding[this.guildID] = Object.assign(
        {},
        utils.config.sharding.default
      );

    //update config with current guild name (guild name can change at any time while the ID is always the same)
    utils.config.sharding[this.guildID].guildName = this.guildName;

    //load settings from config (loads defaults if previous config wasn't found)
    this.defaultVolume = utils.config.sharding[this.guildID].defaultVolume;
    this.announcementsRole =
      utils.config.sharding[this.guildID].announcementsRole;
    this.newMemberRole = utils.config.sharding[this.guildID].newMemberRole;
    this.defaultTextChannel =
      utils.config.sharding[this.guildID].defaultTextChannel;
    this.welcomeTextChannel =
      utils.config.sharding[this.guildID].welcomeTextChannel;
    this.welcomeMsg = utils.config.sharding[this.guildID].welcomeMsg;
    this.ruleTextChannel = utils.config.sharding[this.guildID].ruleTextChannel;
    this.defaultVoiceChannel =
      utils.config.sharding[this.guildID].defaultVoiceChannel;

    //save config (should be done after every edit to the config object)
    utils.dumpJSON("./config.json", utils.config, 2);
  }
}

module.exports = {
  Bot: Bot,
};
