
const fs = require('fs');

//init config (create with defaults if not exists)
let config = {};
if(!fs.existsSync('./config.json')) {
    config = {
        "pubIP": false,
        "windowState": {
            "bounds": {},
            "max": false
        },
        "prefix": "~",
        "welcomeMsgPre": "A new pawn for my schemes!?!?",
        "sendoffMsgPre": "Aww... there goes another pawn...",
        "botAdmin": [
            "125759724707774464",
            "125758417934483456"
        ],
        "sharding": {
            "default": {
                "name": "",                   "defaultVolume": 15,
                "announcementsRole": false,   "newMemberRole": false,
                "defaultTextChannel": false,  "welcomeTextChannel": false,
                "ruleTextChannel": false,     "welcomeMsg": false,
                "defaultVoiceChannel": false
            }
        }
    }
    dumpJSON('config.json', config, 2);
}
else {
    config = require('./config.json');
}


module.exports = {
    config: config,
    saveConfig: saveConfig,
    getTime: getTime,
    getTimeRaw: getTimeRaw,
    welcome: welcome,
    sendoff: sendoff,
    wrongChannel: wrongChannel,
    adminCheck: adminCheck,
    botAdminCheck: botAdminCheck,
    findMemberFromGuild: findMemberFromGuild,
    findRoleFromGuild: findRoleFromGuild,
    findChanFromGuild: findChanFromGuild,
    systemCMDs: systemCMDs,
    populateCmds: populateCmds,
    populateAdmin: populateAdmin,
    aliasCheck: aliasCheck,
    dumpJSON: dumpJSON,
    cleanChannelName: cleanChannelName,
    dumbifyBot: dumbifyBot
}

//gets the current date/time and formats it
function getTime() {
    let cTime = new Date(Date.now());
    let timeStr = `[${zeroify(cTime.getMonth()+1)}/${zeroify(cTime.getDate())} ${zeroify(cTime.getHours())}:${zeroify(cTime.getMinutes())}:${zeroify(cTime.getSeconds())}]`;
    return timeStr;
}
function getTimeRaw() {
    return new Date().getTime();
}
function zeroify(num) {
    if(num < 10) {
        return `0${num}`
    }
    else return `${num}`
}

//handles the welcome message when a new member joins a server
function welcome(mem, anno) {
    let toReturn = (`${config.welcomeMsgPre} Welcome ${mem.toString()} to ${mem.guild.name}!`
                    +"\nI'm a bot! You can use `"+config.prefix+"help` or `"+config.prefix+"?` to view a list of commands or `"+config.prefix+"? (command)` without the parentheses to get help with a specific command.");
    if (anno) toReturn += ("\nIf you would like to receive notifications for announcements from this server, do `"+config.prefix+"announcements in`. You can opt out at any time by doing `"+config.prefix+"announcements out`.");
    toReturn += "\nIf you encounter any bugs or issues with me, or have any suggestions for new features, DM `SpEaGs#2936`."
    return toReturn;
}

//handles the sendoff message when a member leaves a server
function sendoff(mem) {
    let toReturn = (`${config.sendoffMsgPre} ${mem.user.username} has left the server.`)
    return toReturn;
}

//handles the 'wrong channel' message if a member posts a command in the wrong channel
function wrongChannel(mem, cmdRec) {
    let toReturn = `${mem} Please post your bot commands here!`;
    if (!cmdRec) toReturn = `${mem} If that message was intended as a command, it wasn't recognized. Please post your bot commands here!`;
    return toReturn;
}

//checks if a given user has admin permissions for a given server
function adminCheck(bot, user) {
    let toReturn = false;
    if (bot.visAdminRoles.get(user.id)) toReturn = true;
    return toReturn;
}

//checks if a given user has admin permissions over the bot
function botAdminCheck(id) {
    let toReturn = false;
    for (let u of config.botAdmin) {
        if (u === id) {
            toReturn = true;
            break;
        }
    }
    return toReturn;
}

//finds a role in a given server from a given role name
function findRoleFromGuild(rolename, guild) {
    for (const role of guild.roles.cache.array()) {
        let check = role.name.toLowerCase().includes(rolename.toLowerCase());
        if (check) return role;
    }
    return false;
}

//finds a member in a given server from a given username
function findMemberFromGuild(username, guild) {
    for (let mem of guild.members.cache.array()) {
        if (mem.displayName.toLowerCase().includes(username.toLowerCase())) return mem;
    }
    return false;
}

//finds a channel in a given server from a given channel name
function findChanFromGuild(channel, guild, chanType = 'text') {
    for (let chan of guild.channels.cache.array()) {
        if (chan.type === chanType && chan.name.toLowerCase().includes(channel.toLowerCase())) return chan;
    }
    return false;
}

//populates an internal list of admin for a given server
function populateAdmin(bot) {
    let guild = bot.guild;
    log(`Populating list of admin roles...`, ['[INFO]', '[UTILS]', `[${bot.guildName}]`]);
    let roles = guild.roles.cache.array();
    for (let r of roles) {
        if (r.permissions.has("ADMINISTRATOR")) {
            for (let u of r.members.array()) {
                bot.visAdminRoles.set(u.id, u);
            }
        }
    }
    log(`Admin role population done!`, ['[INFO]', '[UTILS]', `[${bot.guildName}]`]);
}

//populates an internal list of commands
function populateCmds(status) {
    log('Populating commands list...', ['[INFO]', '[UTILS]']);
    let cmdFiles = fs.readdirSync('./commands/');
    status.client.cmds.clear();
    for (let file of cmdFiles) {
        let command = require(`./commands/${file}`);
        status.client.cmds.set(command.name, command);
        log(`Found command: ${command.name}`, ['[INFO]', '[UTILS]']);
    }
    log('Command population done!', ['[INFO]', '[UTILS]']);
}

//checks internal list of commands for a given alias
function aliasCheck(alias, status) {
    for (let cmd of status.client.cmds.array()) {
        if (cmd.alias !== false && cmd.alias.includes(alias)) {
            return cmd;
        }
    }
    return false;
}

//cleans a channel name (parses a given string to escape any apostrophe found)
function cleanChannelName(name) {
    if (name.includes("'")) {
        cleanName = name.split("'").join("\\'");
        return cleanName;
    }
    else return name;
}

//saves given bot's settings to config file
function saveConfig(bot) {
    config.sharding[bot.guildID].guildName = bot.guildName;
    config.sharding[bot.guildID].defaultVolume = bot.defaultVolume;
    config.sharding[bot.guildID].defaultVoiceChannel = bot.defaultVoiceChannel;
    config.sharding[bot.guildID].announcementsRole = bot.announcementsRole;
    config.sharding[bot.guildID].newMemberRole = bot.newMemberRole;
    config.sharding[bot.guildID].defaultTextChannel = bot.defaultTextChannel;
    config.sharding[bot.guildID].welcomeTextChannel = bot.welcomeTextChannel;
    config.sharding[bot.guildID].welcomeMsg = bot.welcomeMsg;
    config.sharding[bot.guildID].ruleTextChannel = bot.ruleTextChannel;
    dumpJSON('./config.json', config, 2);
}

//handles all system commands (commands related to the bot, not things it does)
function systemCMDs(cmd, status=require('main.js')) {
    let sysCmd;
    switch (cmd) {
        case 'refreshcmds': {
            sysCmd = true;
            populateCmds(status);
            break;
        }
        case 'refreshadmin': {
            sysCmd = true;
            populateAdmin(status, status.guild);
            break;
        }
        case 'kill': {
            sysCmd = true;
            status.client.destroy();
            process.exit(0);
        }
        default: {
            sysCmd = false;
            break;
        }
    }
    return sysCmd;
}

//dumps a given object's JSON to a json file
function dumpJSON(filename, data, spaces=0) {
    fs.writeFile(filename, JSON.stringify(data, null, spaces), (err) => {
        if (err) {
            log(`Error dumping JSON to file:\n${err}`, ['[ERR]', '[UTILS]']);
        }
    });
}

//returns a simplified version of the given bot object (for sending to web clients)
function dumbifyBot(bot) {
    let np = {}
    let dumbBot = {
        guildID: bot.guildID,
        guildName: bot.guildName,
        nowPlaying: false,
        audioQueue: [],
        voiceChannel: bot.voiceChannel,
        voiceChannelArray: bot.voiceChannelArray,
        defaultVoiceChannel: bot.defaultVoiceChannel,
        textChannelArray: bot.textChannelArray,
        defaultTextChannel: bot.defaultTextChannel,
        ruleTextChannel: bot.ruleTextChannel,
        welcomeTextChannel: bot.welcomeTextChannel,
        roleArray: bot.roleArray,
        announcementsRole: bot.announcementsRole,
        newMemberRole: bot.newMemberRole,
        defaultVolume: bot.defaultVolume,
        welcomeMsg: bot.welcomeMsg,
        paused: false
    }
    if (bot.nowPlaying) {
        let np = {
            videoDetails: {
                title: bot.nowPlaying.videoDetails.title,
                lengthSeconds: bot.nowPlaying.videoDetails.lengthSeconds
            },
            trackSource: bot.nowPlaying.trackSource,
            url: bot.nowPlaying.url,
            added_by: bot.nowPlaying.added_by
        }
        dumbBot.nowPlaying = np;
        dumbBot.paused = bot.dispatcher.paused;
    }
    if (bot.audioQueue.length > 0) {
        let aq = [];
        for (let i of bot.audioQueue) {
            let aqd = {
                videoDetails: {
                    title: i.videoDetails.title,
                    lengthSeconds: i.videoDetails.lengthSeconds
                },
                trackSource: i.trackSource,
                url: i.url,
                added_by: i.added_by
            }
            aq.push(aqd);
        }
        dumbBot.audioQueue = aq;
    }
    return dumbBot;
}
