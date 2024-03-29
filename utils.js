const fs = require("fs");
const { Routes, PermissionsBitField } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { TOKEN } = require("./tokens.json");

//init config (create with defaults if not exists)
let config = {};
if (!fs.existsSync("./config.json")) {
  config = {
    pubIP: false,
    prefix: "/",
    welcomeMsgPre: "A new pawn for my schemes!?!?",
    sendoffMsgPre: "Aww... there goes another pawn...",
    botAdmin: ["125759724707774464", "125758417934483456"],
    webAppDomain: "http://76.179.53.45:3000/",
    sharding: {
      default: {
        guildName: "",
        announcements: false,
        announcementsRole: false,
        newMember: false,
        newMemberRole: false,
        defaultTextChannel: false,
        welcomeTextChannel: false,
        ruleTextChannel: false,
        welcomeMsg: false,
        defaultVoiceChannel: false,
      },
    },
  };
  dumpJSON("config.json", config, 2);
} else {
  config = require("./config.json");
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
  populateCmds: populateCmds,
  populateAdmin: populateAdmin,
  aliasCheck: aliasCheck,
  dumpJSON: dumpJSON,
  cleanChannelName: cleanChannelName,
  dumbifyBot: dumbifyBot,
  msToTime: msToTime,
  populateUsers: populateUsers,
  informClients: informClients,
  informAdminClients: informAdminClients,
};

//gets the current date/time and formats it
function getTime() {
  let cTime = new Date(Date.now());
  let timeStr = `[${zeroify(cTime.getMonth() + 1)}/${zeroify(
    cTime.getDate()
  )} ${zeroify(cTime.getHours())}:${zeroify(cTime.getMinutes())}:${zeroify(
    cTime.getSeconds()
  )}]`;
  return timeStr;
}
function getTimeRaw() {
  return new Date().getTime();
}
function zeroify(num) {
  if (num < 10) {
    return `0${num}`;
  } else return `${num}`;
}

//handles the welcome message when a new member joins a server
function welcome(mem, anno) {
  let toReturn =
    `${config.welcomeMsgPre} Welcome ${mem.toString()} to ${mem.guild.name}!` +
    "\nI'm a bot! You can use `" +
    config.prefix +
    "help` or `" +
    config.prefix +
    "?` to view a list of commands or `" +
    config.prefix +
    "? (command)` without the parentheses to get help with a specific command.";
  if (anno)
    toReturn +=
      "\nIf you would like to receive notifications for announcements from this server, do `" +
      config.prefix +
      "announcements in`. You can opt out at any time by doing `" +
      config.prefix +
      "announcements out`.";
  toReturn +=
    "\nIf you encounter any bugs or issues with me, or have any suggestions for new features, DM `SpEaGs#2936`.";
  return toReturn;
}

//handles the sendoff message when a member leaves a server
function sendoff(mem) {
  let toReturn = `${config.sendoffMsgPre} ${mem.user.username} has left the server.`;
  return toReturn;
}

//handles the 'wrong channel' message if a member posts a command in the wrong channel
function wrongChannel(mem, cmdRec) {
  let toReturn = `${mem} Please post your bot commands here!`;
  if (!cmdRec)
    toReturn = `${mem} If that message was intended as a command, it wasn't recognized. Please post your bot commands here!`;
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
  return guild.roles.cache.find((role) =>
    role.name.toLowerCase().includes(rolename.toLowerCase())
  );
}

//finds a member in a given server from a given username
function findMemberFromGuild(username, guild) {
  return guild.members.cache.find((mem) =>
    mem.displayName.toLowerCase().includes(username.toLowerCase())
  );
}

//finds a channel in a given server from a given channel name
function findChanFromGuild(channel, bot, chanType = 0) {
  let chan = bot.guild.channels.cache.find((c) => {
    if (
      c.name.toLowerCase().includes(channel.toLowerCase()) &&
      c.type === chanType
    )
      return c;
  });
  if (!!chan) return chan;
  else {
    switch (chanType) {
      case 0:
        return bot.guild.channels.cache.get(bot.defaultTextChannel.id);
      case 2:
        return bot.guild.channels.cache.get(bot.defaultVoiceChannel.id);
    }
  }
}

//populates an internal list of admin for a given server
function populateAdmin(bot) {
  log(`Populating list of admin roles...`, [
    "[INFO]",
    "[UTILS]",
    `[${bot.guildName}]`,
  ]);
  bot.guild.roles.cache.forEach((r) => {
    if (r.permissions.has(PermissionsBitField.Flags.Administrator)) {
      r.members.forEach((u) => {
        bot.visAdminRoles.set(u.id, u);
      });
    }
  });
  log(`Admin role population done!`, [
    "[INFO]",
    "[UTILS]",
    `[${bot.guildName}]`,
  ]);
}

//populates an internal list of commands
function populateCmds(status) {
  let cmdReg = [];
  log("Populating commands list...", ["[INFO]", "[UTILS]"]);
  let cmdFiles = fs.readdirSync("./commands/");
  status.client.cmds.clear();
  for (let file of cmdFiles) {
    let command = require(`./commands/${file}`);
    cmdReg.push(command.data.toJSON());
    status.client.cmds.set(command.name.toLowerCase(), command);
    log(`Found command: ${command.name}`, ["[INFO]", "[UTILS]"]);
  }
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  (async () => {
    try {
      log("Sending slash command data...", ["[INFO]", "[UTILS]"]);
      status.client.children.forEach(async (b) => {
        await rest.put(
          Routes.applicationGuildCommands(
            status.client.application.id,
            b.guildID
          ),
          { body: cmdReg }
        );
      });
      log("Slash commands updated successfully!", ["[INFO]", "[UTILS]"]);
    } catch (err) {
      log("Error sending updates for slash commands.", ["[ERR]", "[UTILS]"]);
      log(err, ["[ERR]", "[UTILS]"]);
    }
  })();
  log("Command population done!", ["[INFO]", "[UTILS]"]);
}

//checks internal list of commands for a given alias
function aliasCheck(alias, status) {
  for (let cmd of status.client.cmds) {
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
  } else return name;
}

//saves given bot's settings to config file
function saveConfig(bot) {
  config.sharding[bot.guildID].guildName = bot.guildName;
  config.sharding[bot.guildID].defaultVoiceChannel = bot.defaultVoiceChannel;
  config.sharding[bot.guildID].announcements = bot.announcements;
  config.sharding[bot.guildID].announcementsRole = bot.announcementsRole;
  config.sharding[bot.guildID].newMember = bot.newMember;
  config.sharding[bot.guildID].newMemberRole = bot.newMemberRole;
  config.sharding[bot.guildID].defaultTextChannel = bot.defaultTextChannel;
  config.sharding[bot.guildID].welcomeTextChannel = bot.welcomeTextChannel;
  config.sharding[bot.guildID].welcomeMsg = bot.welcomeMsg;
  config.sharding[bot.guildID].ruleTextChannel = bot.ruleTextChannel;
  dumpJSON("./config.json", config, 2);
}

//dumps a given object's JSON to a json file
function dumpJSON(filename, data, spaces = 0) {
  fs.writeFile(filename, JSON.stringify(data, null, spaces), (err) => {
    if (err) {
      log(`Error dumping JSON to file:\n${err}`, ["[ERR]", "[UTILS]"]);
    }
  });
}

//returns a simplified version of the given bot object (for sending to web clients)
function dumbifyBot(bot, admin = false) {
  let np = {};
  let dumbBot = {
    admin: admin,
    guildID: bot.guildID,
    guildName: bot.guildName,
    nowPlaying: false,
    audioQueue: [],
    voiceChannel: false,
    voiceChannelArray: bot.voiceChannelArray,
    paused: false,
  };
  if (admin) {
    Object.assign(dumbBot, {
      defaultVoiceChannel: bot.defaultVoiceChannel,
      textChannelArray: bot.textChannelArray,
      defaultTextChannel: bot.defaultTextChannel,
      ruleTextChannel: bot.ruleTextChannel,
      welcomeTextChannel: bot.welcomeTextChannel,
      roleArray: bot.roleArray,
      announcements: bot.announcements,
      announcementsRole: bot.announcementsRole,
      newMember: bot.newMember,
      newMemberRole: bot.newMemberRole,
      welcomeMsg: bot.welcomeMsg,
    });
  }
  if (bot.voiceChannel) {
    let vc = {
      id: bot.voiceChannel.id,
      name: bot.voiceChannel.name,
    };
    dumbBot.voiceChannel = vc;
  }
  if (bot.nowPlaying) {
    let np = {
      videoDetails: {
        title: bot.nowPlaying.videoDetails.title,
        lengthSeconds: bot.nowPlaying.videoDetails.lengthSeconds,
        startedAt: bot.nowPlaying.videoDetails.startedAt,
      },
      trackSource: bot.nowPlaying.trackSource,
      url: bot.nowPlaying.url,
      imgURL: bot.nowPlaying.imgURL,
      added_by: bot.nowPlaying.added_by,
    };
    dumbBot.nowPlaying = np;
    dumbBot.paused = bot.dispatcher.paused;
  }
  if (bot.audioQueue.length > 0) {
    let aq = [];
    for (let i of bot.audioQueue) {
      let aqd = {
        videoDetails: {
          title: i.videoDetails.title,
          lengthSeconds: i.videoDetails.lengthSeconds,
        },
        trackSource: i.trackSource,
        url: i.url,
        imgURL: i.imgURL,
        added_by: i.added_by,
      };
      aq.push(aqd);
    }
    dumbBot.audioQueue = aq;
  }
  return dumbBot;
}

function msToTime(ms) {
  let time = {
    secs: Math.floor((ms / 1000) % 60),
    mins: Math.floor((ms / (1000 * 60)) % 60),
    hours: Math.floor((ms / (1000 * 60 * 60)) % 24),
    days: Math.floor((ms / (1000 * 60 * 60 * 24)) % 365),
    years: Math.floor(ms / (1000 * 60 * 60 * 24 * 365)),
  };
  let timeOut = [];
  if (time.secs > 0) timeOut.unshift(`${time.secs} seconds`);
  if (time.mins > 0) timeOut.unshift(`${time.mins} minutes`);
  if (time.hours > 0) timeOut.unshift(`${time.hours} hours`);
  if (time.days > 0) timeOut.unshift(`${time.days} days`);
  if (time.years > 0) timeOut.unshift(`${time.years} years`);
  return timeOut.join(", ");
}

function populateUsers(status, bot) {
  let seen = status.client.lastSeen;
  bot.guild.members.cache.forEach((u) => {
    if (!seen[u.id] && !!u.presence && u.presence.status !== "online")
      seen[u.id] = getTimeRaw();
  });
}

function informClients(bot, data) {
  let payload = { guildID: bot.guildID, data: data };
  bot.socketSubs.forEach((s) => {
    s.emit("guild_partial", payload);
  });
}

function informAdminClients(bot, data) {
  let payload = { guildID: bot.guildID, data: data };
  bot.adminSocketSubs.forEach((s) => {
    s.emit("guild_partial", payload);
  });
}
