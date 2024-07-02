const fs = require("fs");
const { Routes, PermissionsBitField } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { TOKEN } = require("./tokens.json");

const { log, warn, err } = require("./logger.js");

class AudioStats extends Object {
  addedBy = "";
  lastPlayed = 0;
  lastPlayedBy = "";
  timesPlayed = 1;
  timesPlayedSinceLastReport = 0;
  constructor() {
    super();
  }
}

class utils {
  AudioStats = AudioStats;
  constructor() {
    //init config (create with defaults if not exists)
    this.config = {};
    if (!fs.existsSync("./config.json")) {
      this.config = {
        pubIP: false,
        welcomeMsgPre: "A new pawn for my schemes!?!?",
        sendoffMsgPre: "Aww... there goes another pawn...",
        botAdmin: ["125759724707774464", "125758417934483456"],
        webAppDomain: "https://speags.com/voidbot/",
        cmdToggles: [],
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
            groupRoles: [],
            audioStats: {
              plays: 0,
              mostPlayedAllTime: "",
              userMostAdded: "",
              mostPlayedSinceLastReport: "",
              playsSinceLastReport: 0,
            },
          },
        },
      };
      this.dumpJSON("config.json", this.config, 2);
    } else {
      this.config = require("./config.json");
    }
    this.getTime = this.getTime.bind(this);
    this.populateCmds = this.populateCmds.bind(this);
    this.cleanUpAudioCache = this.cleanUpAudioCache.bind(this);
    this.saveConfig = this.saveConfig.bind(this);
  }
  //gets the current date/time and formats it
  getTime() {
    let cTime = new Date(Date.now());
    let timeStr = `[${this.zeroify(cTime.getMonth() + 1)}/${this.zeroify(
      cTime.getDate()
    )} ${this.zeroify(cTime.getHours())}:${this.zeroify(
      cTime.getMinutes()
    )}:${this.zeroify(cTime.getSeconds())}]`;
    return timeStr;
  }
  getTimeRaw() {
    return new Date().getTime();
  }
  zeroify(num) {
    if (num < 10) {
      return `0${num}`;
    } else return `${num}`;
  }

  //handles the welcome message when a new member joins a server
  welcome(mem, bot) {
    let welcome = `${this.config.welcomeMsgPre} Welcome ${mem.toString()} to ${
      mem.guild.name
    }!${
      !!bot.ruleTextChannel
        ? `\nPlease read the rules in ${bot.guild.channels.cache
            .get(bot.ruleTextChannel.id)
            .toString()}`
        : ""
    }${
      bot.announcements
        ? "\nIf you would like to receive notifications for announcements from this server, do `/announcements in`. You can opt out at any time by doing `/announcements out`."
        : ""
    }\nI'm a bot! You can use \`/help\` to view a list of commands or \`/help (command)\` without the parentheses to get help with a specific command.\nIf you encounter any bugs or issues with me, or have any suggestions for new features, feel free to open a ticket on the github page: https:///github.com/SpEaGs/VoidBot.`;
    return welcome;
  }

  //handles the sendoff message when a member leaves a server
  sendoff(mem) {
    let toReturn = `${this.config.sendoffMsgPre} ${mem.user.username} has left the server.`;
    return toReturn;
  }

  //handles the 'wrong channel' message if a member posts a command in the wrong channel
  wrongChannel(mem, cmdRec) {
    let toReturn = `${mem} Please post your bot commands here!`;
    if (!cmdRec)
      toReturn = `${mem} If that message was intended as a command, it wasn't recognized. Please post your bot commands here!`;
    return toReturn;
  }

  //checks if a given user has admin permissions for a given server
  adminCheck(bot, user) {
    let toReturn = false;
    if (bot.visAdminRoles.get(user.id)) toReturn = true;
    return toReturn;
  }

  //checks if a given user has admin permissions over the bot
  botAdminCheck(id) {
    let toReturn = false;
    for (let u of this.config.botAdmin) {
      if (u === id) {
        toReturn = true;
        break;
      }
    }
    return toReturn;
  }

  //finds a role in a given server from a given role name
  findRoleFromGuild(rolename, guild) {
    return guild.roles.cache.find((role) =>
      role.name.toLowerCase().includes(rolename.toLowerCase())
    );
  }
  findIDRoleFromGuild(roleid, guild) {
    return guild.roles.cache.find((role) => role.id === roleid);
  }

  //finds a member in a given server from a given username
  findMemberFromGuild(username, guild) {
    return guild.members.cache.find((mem) =>
      mem.displayName.toLowerCase().includes(username.toLowerCase())
    );
  }

  //finds a channel in a given server from a given channel name
  findChanFromGuild(channel, bot, chanType = 0) {
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
  populateAdmin(bot) {
    log(`Populating list of admin roles...`, [
      "[UTILS]",
      `[${bot.guild.name}]`,
    ]);
    bot.guild.roles.cache.forEach((r) => {
      if (r.permissions.has(PermissionsBitField.Flags.Administrator)) {
        r.members.forEach((u) => {
          bot.visAdminRoles.set(u.id, u);
        });
      }
    });
    log(`Admin role population done!`, ["[UTILS]", `[${bot.guild.name}]`]);
  }

  //populates an internal list of commands
  populateCmds(status) {
    let cmdReg = [];
    log("Populating commands list...", ["[UTILS]"]);
    let cmdFiles = fs.readdirSync("./commands/");

    status.client.cmds.clear();

    this.config.cmdToggles = [];
    for (let file of cmdFiles) {
      let command = require(`./commands/${file}`);
      if (command.name.toLowerCase() !== "botadmin")
        this.config.cmdToggles.push({
          name: command.name.toLowerCase(),
          state: true,
        });
      cmdReg.push(command.data.toJSON());
      status.client.cmds.set(command.name.toLowerCase(), command);
      log(`Found command: ${command.name}`, ["[UTILS]"]);
    }
    this.dumpJSON("./config.json", this.config, 2);
    const rest = new REST({ version: "10" }).setToken(TOKEN);
    (async () => {
      try {
        log("Sending slash command data...", ["[UTILS]"]);
        status.client.children.forEach(async (b) => {
          await rest.put(
            Routes.applicationGuildCommands(
              status.client.application.id,
              b.guild.id
            ),
            { body: cmdReg }
          );
        });
        log("Slash commands updated successfully!", ["[UTILS]"]);
      } catch (error) {
        err("Error sending updates for slash commands.", ["[UTILS]"]);
        err(error, ["[UTILS]"]);
      }
    })();
    log("Command population done!", ["[UTILS]"]);
  }

  //checks internal list of commands for a given alias
  aliasCheck(alias, status) {
    for (let cmd of status.client.cmds) {
      if (cmd.alias !== false && cmd.alias.includes(alias)) {
        return cmd;
      }
    }
    return false;
  }

  //cleans a channel name (parses a given string to escape any apostrophe found)
  cleanChannelName(name) {
    if (name.includes("'")) {
      cleanName = name.split("'").join("\\'");
      return cleanName;
    } else return name;
  }

  //saves given bot's settings to config file
  saveConfig(bot) {
    this.config.sharding[bot.guild.id].guildName = bot.guild.name;
    this.config.sharding[bot.guild.id].defaultVoiceChannel =
      bot.defaultVoiceChannel;
    this.config.sharding[bot.guild.id].announcements = bot.announcements;
    this.config.sharding[bot.guild.id].announcementsRole =
      bot.announcementsRole;
    this.config.sharding[bot.guild.id].newMember = bot.newMember;
    this.config.sharding[bot.guild.id].newMemberRole = bot.newMemberRole;
    this.config.sharding[bot.guild.id].defaultTextChannel =
      bot.defaultTextChannel;
    this.config.sharding[bot.guild.id].welcomeTextChannel =
      bot.welcomeTextChannel;
    this.config.sharding[bot.guild.id].welcomeMsg = bot.welcomeMsg;
    this.config.sharding[bot.guild.id].ruleTextChannel = bot.ruleTextChannel;
    this.config.sharding[bot.guild.id].audioStats = bot.audioStats;
    this.dumpJSON("./config.json", this.config, 2);
  }

  //dumps a given object's JSON to a json file
  dumpJSON(filename, data, spaces = 0) {
    fs.writeFile(filename, JSON.stringify(data, null, spaces), (error) => {
      if (error) {
        err(`Error dumping JSON to file:\n${error}`, ["[UTILS]"]);
      }
    });
  }

  //returns a simplified version of the given bot object (for sending to web clients)
  dumbifyBot(bot, admin = false) {
    let dumbBot = {
      admin: admin,
      guildID: bot.guild.id,
      guildName: bot.guild.name,
      nowPlaying: false,
      audioQueue: bot.audioQueue.length > 0 ? bot.audioQueue : [],
      voiceChannel: bot.voiceChannel
        ? { id: bot.voiceChannel.id, name: bot.voiceChannel.name }
        : false,
      voiceChannelArray: bot.voiceChannelArray,
      paused: false,
      nowPlaying: bot.nowPlaying ? bot.nowPlaying : false,
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
    return dumbBot;
  }

  msToTime(ms) {
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

  populateUsers(bot) {
    bot.guild.members.cache.forEach((u) => {
      if (!!u.presence && u.presence.status !== "online")
        bot.status.client.lastSeen[u.id] = 0;
    });
  }

  informClients(bot, data) {
    let payload = { guildID: bot.guild.id, data: data };
    bot.socketSubs.forEach((s) => {
      s.emit("guild_partial", payload);
    });
  }

  informAdminClients(bot, data) {
    let payload = { guildID: bot.guild.id, data: data };
    bot.adminSocketSubs.forEach((s) => {
      s.emit("guild_partial", payload);
    });
  }

  informAllClients(status, data) {
    status.client.sockets.forEach((s) => {
      s.emit("base_data", data);
    });
  }

  cleanUpSockets(status) {
    status.consoleSockets.forEach((s) => {
      if (!s.connected) {
        status.consoleSockets.delete(s.id);
      }
    });
    status.sockets.forEach((s) => {
      if (!s.connected) {
        status.sockets.delete(s.id);
      }
    });
  }

  cleanUpAudioCache(status) {
    console.log(typeof log);
    log("Cleaning audio cache...", ["[AUDIOCACHE]"]);
    const CacheFile = require("./models/cachefile");
    const cachePath = "/mnt/raid5/voidbot/audiocache/";
    const hardFileList = fs.readdirSync(cachePath);
    CacheFile.find({}).then((files) => {
      const missingDocs = hardFileList.filter(
        (file) => !files.some((doc) => doc.NOD === file)
      );
      if (missingDocs.length > 0) {
        missingDocs.forEach((miss) => {
          fs.unlinkSync(`${cachePath}${miss}`);
          log(`Found and removed file missing associated db entry.`, [
            "[AUDIOCACHE]",
          ]);
        });
      }
      let totalSize = 0;
      files.forEach((f) => {
        const exists = fs.existsSync(`${cachePath}${f.NOD}`);
        if (exists && f.downloaded) {
          const fsize = fs.statSync(`${cachePath}${f.NOD}`).size;
          totalSize += fsize;
        } else {
          CacheFile.findOneAndRemove({ NOD: f.NOD }).then(() => {
            this.informAllClients(status, {
              audioCache: { remove: true, info: f },
            });
            log(`Found and removed db entry missing associated file.`, [
              "[AUDIOCACHE]",
            ]);
          });
        }
      });
      let oldest = {};
      if (totalSize > 25 * 1024 * 1024 * 1024) {
        oldest = files.reduce((oldest, current) => {
          return current.stats.lastPlayed < oldest.stats.lastPlayed
            ? current
            : oldest;
        }, files[0]);
        fs.unlinkSync(`${cachePath}${oldest.NOD}`);
        CacheFile.findOneAndRemove({ _id: oldest._id }).then(() => {
          this.informAllClients(status, {
            audioCache: { remove: true, info: oldest },
          });
          log(`Audio cache full. Removed song: ${oldest.title}`, [
            "[AUDIOCACHE]",
          ]);
        });
      }
      const groupedByTitle = files.reduce((acc, doc) => {
        if (!acc[doc.title]) acc[doc.title] = [];
        acc[doc.title].push(doc);
        return acc;
      }, {});
      for (const title in groupedByTitle) {
        const docs = groupedByTitle[title];
        if (docs.length > 1) {
          docs.sort((a, b) => b.stats.lastPlayed - a.stats.lastPlayed);
          const [first, ...dupes] = docs;
          const dupeIds = dupes.map((doc) => doc._id);
          CacheFile.deleteMany({ _id: { $in: dupeIds } }).then(() => {
            dupes.forEach((dupe) => {
              fs.unlinkSync(`${cachePath}${dupe.NOD}`);
            });
            log(
              `Found and removed ${
                dupes.length > 1
                  ? `${dupes.length} duplicate entries & files`
                  : `${dupes.length} duplicate entry & file`
              } for: "${title}"`,
              ["[AUDIOCACHE]"]
            );
          });
        }
      }
      log("Audio cache cleanup done!", ["[AUDIOCACHE]"]);
    });
  }
}

module.exports = new utils();
