
const Discord = require('discord.js');
const EventEmitter = require('events');

const utils = require('./utils.js');
const token = require('./tokens.json');

class Bot extends EventEmitter {
    constructor(guild, status) {
        super();
        let log = global.log;
        this.status = status;
        this.guildID = guild.id;
        this.guildName = guild.name;
        this.fs = require('fs');
        this.client = new Discord.Client();
        this.client.visAdminRoles = new Discord.Collection();
        this.guild = false;
        this.dispatcher = false;
        this.voiceChannel = false;
        this.defaultVolume = 0;
        this.voiceChannelArray = [];
        this.voiceConnection = false;
        this.audioQueue = [];
        this.nowPlaying = false;
        this.announcementsRole = false;
        this.newMemberRole = false;
        this.defaultTextChannel = false;
        this.ruleTextChannel = false;
        this.textChannelArray = [];
        this.roleArray = [];

        log(`[${this.guildName}] Logging in...`);
        this.client.login(token);

        if (!utils.config.sharding[this.guildID]) utils.config.sharding[this.guildID] = Object.assign({}, utils.config.sharding.default);

        this.defaultVolume = utils.config.sharding[this.guildID].defaultVolume;
        this.announcementsRole = utils.config.sharding[this.guildID].announcementsRole;
        this.newMemberRole = utils.config.sharding[this.guildID].newMemberRole;
        this.defaultTextChannel = utils.config.sharding[this.guildID].defaultTextChannel;
        this.ruleTextChannel = utils.config.sharding[this.guildID].ruleTextChannel;

        utils.dumpJSON('./config.json', utils.config, 2);
    }
}

module.exports = {
    Bot: Bot
}