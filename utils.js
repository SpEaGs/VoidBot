
const fs = require('fs');

//init config (create with defaults if not exists)
let config = {};
if(!fs.existsSync('./config.json')) {
    config = {
        "windowState": {
            "bounds": {}
        },
        "prefix": "~",
        "welcomeMsgPre": "A new pawn for my schemes!?!?",
        "sendoffMsgPre": "Aww... there goes another pawn...",
        "botAdmin": [
            "125759724707774464",
            "125758417934483456"
        ],
        "commands": [
            "help.js",        "announcements.js",    "ping.js",
            "slap.js",        "prune.js",            "role.js",
            "join.js",        "leave.js",            "play.js",
            "pause.js",       "resume.js",           "stop.js",
            "skip.js",        "volume.js",           "nowplaying.js",
            "playlist.js",    "welcome.js"

        ],
        "sharding": {
            "default": {
                "name": "",                  "localMusic": false,
                "voiceChannel": false,       "commandChannel": false,
                "defaultVolume": "15",       "announcementsRole": false,
                "newUserRole": false,        "defaultTextChannel": false,
                "welcomeTextChannel": false, "ruleTextChannel": false, 
                "localMusicVC": false,       "welcomeMsg": false
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
    welcome: welcome,
    sendoff: sendoff,
    adminCheck: adminCheck,
    botAdminCheck: botAdminCheck,
    findMemberFromGuild: findMemberFromGuild,
    findRoleFromGuild: findRoleFromGuild,
    systemCMDs: systemCMDs,
    populateCmds: populateCmds,
    populateAdmin: populateAdmin,
    aliasCheck: aliasCheck,
    dumpJSON: dumpJSON,
    cleanChannelName: cleanChannelName
}

//handles the welcome message when a new member joins a server
function welcome(mem, anno) {
    let toReturn = (`${config.welcomeMsgPre} Welcome ${mem.toString()} to ${mem.guild.name}!`
                    +"\nI'm a bot! You can use `"+config.prefix+"help` or `"+config.prefix+"?` to view a list of commands or `"+config.prefix+"? (command)` without the parentheses to get help with a specific command.");
    if (anno) toReturn += ("\nIf you would like to receive notifications for announcements from this server, do `"+config.prefix+"announcements in`. You can op out at any time by doing `"+config.prefix+"announcements out`.");
    return toReturn;
}

//handles the sendoff message when a member leaves a server
function sendoff(mem) {
    let toReturn = (`${config.sendoffMsgPre} ${mem.toString()} has left the server.`)
    return toReturn;
}

//checks if a given user has admin permissions for a given server
function adminCheck(client, user) {
    let toReturn = false;
    for (let u of client.visAdminRoles.array()) {
        if (u === user.id) {
            toReturn = true;
            break;
        }
    }
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
    for (const role of guild.roles.array()) {
        let check = role.name.toLowerCase().includes(rolename.toLowerCase());
        if (check) return role;
    }
    return false;
}

//finds a member in a given server from a given username
function findMemberFromGuild(username, guild) {
    for (let mem of guild.members.array()) {
        if (mem.user.username.toLowerCase() === username.toLowerCase()) return mem;
    }
    return false;
}

//populates an internal list of admin for a given server
function populateAdmin(status, guild) {
    global.log(`[${status.guildName}] Populating list of admin roles...`);
    let roles = guild.roles.array();
    for (let r of roles) {
        if (r.hasPermission("ADMINISTRATOR")) {
            for (let u of r.members.array()) {
                status.client.visAdminRoles.set(u, u.id);
            }
        }
    }
    global.log(`[${status.guildName}] Admin role population done!`);
}

//populates an internal list of commands
function populateCmds(status) {
    global.log('[MAIN] Populating commands list...');
    let cmdFiles = config.commands;
    for (let file of cmdFiles) {
        let command = require(`./commands/${file}`);
        command.status = status;
        status.client.cmds.set(command.name, command);
        global.log(`[MAIN] Found command: ${command.name}`);
    }
    global.log('[MAIN] Command population done!');
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
            for (bot of status.client.children.array()) bot.client.destroy();
            status.client.destroy();
            process.exit();
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
            console.error(err);
        }
    });
}
