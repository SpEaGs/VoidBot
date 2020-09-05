
const Discord = require('discord.js');
const EventEmitter = require('events');

const utils = require('./utils.js');
const token = require('./tokens.json').TOKEN;

class Bot extends EventEmitter {
    constructor(guild, status) {
        super();
        //init bot's vars
        let log = global.log;
        this.status = status;
        this.guildID = guild.id;
        this.guildName = guild.name;
        this.fs = require('fs');
        this.visAdminRoles = new Discord.Collection();
        this.guild = guild;
        this.dispatcher = false;
        this.voiceChannel = false;
        this.defaultVoiceChannel = false;
        this.defaultVolume = 0;
        this.voiceChannelArray = [];
        this.voiceConnection = false;
        this.audioQueue = [];
        this.nowPlaying = false;
        this.announcementsRole = false;
        this.newMemberRole = false;
        this.defaultTextChannel = false;
        this.welcomeMsg = false;
        this.welcomeTextChannel = false;
        this.ruleTextChannel = false;
        this.textChannelArray = [];
        this.roleArray = [];

        //login
        log(`[${this.guildName}] Initializing...`);
        //this.client.login(token);

        //check for previously saved config & create from defaults if not found
        if (!utils.config.sharding[this.guildID]) utils.config.sharding[this.guildID] = Object.assign({}, utils.config.sharding.default);

        //update config with current guild name (guild name can change at any time while the ID is always the same)
        utils.config.sharding[this.guildID].guildName = this.guildName;
        
        //load settings from config (loads defaults if previous config wasn't found)
        this.defaultVolume = utils.config.sharding[this.guildID].defaultVolume;
        this.announcementsRole = utils.config.sharding[this.guildID].announcementsRole;
        this.newMemberRole = utils.config.sharding[this.guildID].newMemberRole;
        this.defaultTextChannel = utils.config.sharding[this.guildID].defaultTextChannel;
        this.welcomeTextChannel = utils.config.sharding[this.guildID].welcomeTextChannel;
        this.welcomeMsg = utils.config.sharding[this.guildID].welcomeMsg;
        this.ruleTextChannel = utils.config.sharding[this.guildID].ruleTextChannel;
        this.defaultVoiceChannel = utils.config.sharding[this.guildID].defaultVoiceChannel;

        //save config (should be done after every edit to the config object)
        utils.dumpJSON('./config.json', utils.config, 2);
    }
}

module.exports = {
    Bot: Bot
}