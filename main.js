const { token } = require("./tokens.json");

const Discord = require("discord.js");
const winston = require("winston");
const fs = require("fs");

const path = require("path");
const url = require("url");

const express = require("express");
const cors = require("cors");
const api = express();
const bParse = require("body-parser");
const cParse = require("cookie-parser");
const passport = require("passport");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
require("./web/utils/connectdb");
require("./web/strategies/jwt");
require("./web/strategies/local");
require("./web/auth");

const userRouter = require("./web/routers/user");

const utils = require("./utils.js");
const Bot = require("./bot.js");

let mainWindow;

//log formatting and pipes to log files
var backlog = [];
var logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.json(),
    winston.format.colorize({
      all: true,
      colors: { info: "white", warning: "yellow", error: "red" },
    })
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});
logger.add(
  new winston.transports.Console({
    format: winston.format.simple(),
  })
);

//init some vars & export
module.exports = {
  eSender: {
    socket: false,
    ipc: false,
  },
  client: new Discord.Client({ forceFetchUsers: true }),
  fs: fs,
  systemUIPopulated: false,
  settingsUIPopulated: false,
  updateVol: updateVol,
  getStatus: getStatus,
};

//set up basic structure for calling/storing discord.js clients (master + children)
const status = require("./main.js");
const bodyParser = require("body-parser");

function getStatus() {
  return status;
}

status.client.children = new Discord.Collection();
status.client.cmds = new Discord.Collection();
status.client.lastSeen = {};
//wraps logger to a function so that console output can also be sent to the UI
function log(str, tags) {
  let lo = { timeStamp: utils.getTime(), tags: tags, msg: str, color: "" };
  let l = `${lo.timeStamp} ${lo.tags.join(" ")}: ${lo.msg}`;
  switch (tags[0]) {
    case "[INFO]": {
      lo.color = "white";
      logger.info(l);
      break;
    }
    case "[WARN]": {
      lo.color = "yellow";
      logger.warn(l);
      break;
    }
    case "[ERR]": {
      lo.color = "red";
      logger.error(l);
      break;
    }
  }
  backlog.push(lo);
  if (status.eSender.socket) status.eSender.socket.emit("stdout", lo);
  if (status.eSender.ipc) status.eSender.ipc.send("stdout", lo);
}
global.log = log;

//webserver
function launchWebServer() {
  api.use(bParse.json());
  api.use(cParse(process.env.COOKIE_SECRET));

  const whitelist = proces.env.WHITELISTED_DOMAINS
    ? process.env.WHITELISTED_DOMAINS.split(",")
    : [];
  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin || whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  };

  api.use(cors(corsOptions));
  api.use(passport.initialize());
  api.use("/users", userRouter);

  api.get("/", (req, res) => {
    res.send({ status: success });
  });

  const server = api.listen(process.env.PORT || 8081, () => {
    const port = server.address().port;
    console.log("API started at oprt:", port);
  });

  clientLogin(token);
}

function initBot(bot) {
  utils.populateAdmin(bot);
  utils.populateUsers(status.client.lastSeen, bot);
  for (let chan of bot.guild.channels.cache.array()) {
    let cleanChanName = utils.cleanChannelName(chan.name);
    switch (chan.type) {
      case "voice": {
        bot.voiceChannelArray.push({
          id: chan.id,
          name: chan.name,
          cName: cleanChanName,
        });
        break;
      }
      case "text": {
        bot.textChannelArray.push({
          id: chan.id,
          name: chan.name,
          cName: cleanChanName,
        });
        break;
      }
    }
  }
  for (let role of bot.guild.roles.cache.array()) {
    let cleanRoleName = utils.cleanChannelName(role.name);
    bot.roleArray.push({ id: role.id, name: role.name, cName: cleanRoleName });
  }
  status.eSender.ipc.send("add-client", utils.dumbifyBot(bot));
}

//discord.js client ready event handler (master client)
try {
  status.client.once("ready", () => {
    utils.populateCmds(status);

    status.client.ws.on("INTERACTION_CREATE", async (interaction) => {
      let bot = status.client.children.get(interaction.guild_id);
      //fetch admin lists & compare user id
      let admin = utils.adminCheck(bot, interaction.member.user);
      let botadmin = utils.botAdminCheck(interaction.member.user.id);
      let adminCheck = false;
      if (admin || botadmin) adminCheck = true;

      //get and run command
      let cmd = status.client.cmds.get(interaction.data.name);
      if (cmd.admin && !adminCheck) {
        status.client.api
          .interactions(interaction.id, interaction.token)
          .callback.post({
            data: {
              type: 4,
              data: {
                content: "You lack sufficient permissions for that command.",
              },
            },
          });
      } else {
        let member = bot.guild.members.cache.get(interaction.member.user.id);
        let msg = {
          author: member,
          member: member,
        };
        let args = [];
        if (interaction.data.options) {
          for (let i of interaction.data.options) {
            args.push(i.value);
          }
        }
        let params = { msg, args, bot };
        cmd.execute(params);
        status.client.api
          .interactions(interaction.id, interaction.token)
          .callback.post({
            data: {
              type: 4,
              data: {
                content: "Command received!",
              },
            },
          });
      }
    });

    //populate info for child clients
    let guilds = status.client.guilds.cache.array();
    for (let i of guilds) {
      i.members.fetch();
      let id = i.id;
      let newBot = new Bot.Bot(i, status);
      status.client.children.set(id, newBot);
      initBot(newBot);
      log("Initialization complete!", [
        "[INFO]",
        "[MAIN]",
        `[${newBot.guildName}]`,
      ]);
    }
    setTimeout(() => {
      launchWebServer(guilds);
    }, 200);

    log("VoidBot Ready! Hello World!", ["[INFO]", "[MAIN]"]);
  });
} catch (error) {
  log(`Error initializing client:\n` + error, ["[ERR]", "[MAIN]"]);
  process.exit(1);
}

//discord.js client event for the bot receiving a message
status.client.on("message", (msg) => {
  let bot = status.client.children.get(msg.guild.id);
  //check incoming message for command and log if true
  if (msg.author.id == status.client.user.id) return;
  if (!msg.content.startsWith(utils.config.prefix)) return;
  log(`${msg}`, ["[INFO]", "[MAIN]", `[${bot.guildName}]`, "[CMD]"]);

  //parse for command arguments
  const args = msg.content.slice(utils.config.prefix.length).split(/ +/);
  const cmdName = args.shift().toLowerCase();

  //fetch admin lists & compare user id
  let admin = utils.adminCheck(bot, msg.author);
  let botadmin = utils.botAdminCheck(msg.author.id);
  let adminCheck = false;
  if (admin || botadmin) adminCheck = true;

  //check system commands & run if found (these are commands related to the bot, not things it does.)
  if (botadmin) {
    var sysCmd = utils.systemCMDs(cmdName, status);
    if (sysCmd) return;
  }

  //check for command alias, arguments, and admin
  let aliCheck = utils.aliasCheck(cmdName, status);
  let cmdRec = true;
  if (!status.client.cmds.has(cmdName) && !aliCheck) {
    log(`Not Recognized.`, ["[INFO]", "[MAIN]", `[${bot.guildName}]`, "[CMD]"]);
    cmdRec = false;
  }
  if (bot.defaultTextChannel && msg.channel.id != bot.defaultTextChannel.id) {
    switch (cmdRec) {
      case true: {
        msg.delete({ reason: "Wrong channel for bot commands." });
        bot.guild.channels.cache
          .get(bot.defaultTextChannel.id)
          .send(utils.wrongChannel(msg.author, cmdRec));
        break;
      }
      case false: {
        bot.guild.channels.cache
          .get(bot.defaultTextChannel.id)
          .send(utils.wrongChannel(msg.author, cmdRec));
        break;
      }
    }
  }
  if (!cmdRec) return;
  let cmd = aliCheck;
  if (!aliCheck) cmd = status.client.cmds.get(cmdName);
  if (cmd.server && msg.channel.type !== "text")
    return msg.reply("That command only works on a server!");
  if (cmd.args && !args.length)
    return msg.reply(`That command needs arguments.\nUsage: ${cmd.usage}`);
  if (cmd.admin && !adminCheck)
    return msg.reply(
      "You do not have sufficient permissions to use that command you fool!"
    );

  //run command
  try {
    let params = { msg, args, bot };
    cmd.execute(params);
  } catch (error) {
    log(`Error executing command:\n` + error, [
      "[WARN]",
      "[MAIN]",
      `[${bot.guildName}]`,
    ]);
    msg.reply(
      "There was an error executing that command! Please ask an admin or `SpEaGs#2936` to check the logs."
    );
  }
});

//discord.js client event for the bot entering a new server
status.client.on("guildCreate", (guild) => {
  let newBot = new Bot.Bot(guild, status);
  log("New server added.", ["[INFO]", "[MAIN]", `[${newBot.guildName}]`]);
  guild.members.fetch();
  status.client.children.set(guild.id, newBot);
  setTimeout(() => {
    initBot(newBot);
    log("Initialization complete!", [
      "[INFO]",
      "[MAIN]",
      `[${newBot.guildName}]`,
    ]);
  }, 400);
  status.eSender.socket.emit("new-guild");
});

//discord.js client event for the bot leaving or being kicked from a server
status.client.on("guildDelete", (guild) => {
  let bot = status.client.children.get(guild.id);
  log("Server removed. Deleting config and data.", [
    "[INFO]",
    "[MAIN]",
    `[${bot.guildName}]`,
  ]);
  status.client.children.delete(guild.id);
  delete utils.config.sharding[guild.id];
  utils.dumpJSON("config.json", utils.config, 2);
  status.eSender.ipc.send("rem-client", guild.id);
  status.eSender.socket.emit("rem-client", guild.id);
});

//discord.js client event for new members joining a server
status.client.on("guildMemberAdd", (member) => {
  let bot = status.client.children.get(member.guild.id);
  log(`New member joined. Welcome message set to: ${bot.welcomeMsg}`, [
    "[INFO]",
    "[MAIN]",
    `[${bot.guildName}]`,
  ]);
  try {
    if (bot.welcomeMsg === false) return;
    if (bot.welcomeTextChannel != false) {
      let anno = false;
      if (bot.announcementsRole != false) anno = true;
      if (bot.ruleTextChannel != false) {
        bot.guild.channels.cache
          .get(bot.welcomeTextChannel.id)
          .send(
            utils.welcome(member, anno) +
              `\nPlease read the rules in ${bot.guild.channels.cache
                .get(bot.ruleTextChannel.id)
                .toString()}`
          );
      } else
        bot.guild.channels.cache
          .get(bot.welcomeTextChannel.id)
          .send(utils.welcome(member, anno));
    }
    if (bot.newMemberRole != false) {
      member.roles.add(bot.newMemberRole.id);
    }
  } catch (error) {
    log(`Error handling guildMemberAdd event:\n` + error, [
      "[WARN]",
      "[MAIN]",
      `[${bot.guildName}]`,
    ]);
  }
});

//discord.js client event for when a member leaves a server
status.client.on("guildMemberRemove", (member) => {
  let bot = status.client.children.get(member.guild.id);
  log("A member left the server.", ["[INFO]", "[MAIN]", `[${bot.guildName}]`]);
  try {
    if (bot.welcomeMsg == false) return;
    if (bot.welcomeTextChannel != false) {
      bot.guild.channels.cache
        .get(bot.welcomeTextChannel.id)
        .send(utils.sendoff(member));
    }
  } catch (error) {
    log(`Error handling guildMemberRemove event:\n` + error, [
      "[WARN]",
      "[MAIN]",
      `[${bot.guildName}]`,
    ]);
  }
});

//discord.js client event for when a guild member updates voice status (join/leave/mute/unmute/deafen/undeafen)
status.client.on("voiceStateUpdate", (oldState, newState) => {
  let bot = status.client.children.get(newState.member.guild.id);
  if (oldState.member.id === status.client.user.id) return;
  if (
    oldState.channel &&
    newState.channel &&
    oldState.channel.id === newState.channel.id
  )
    return;
  try {
    if (!newState.channel) {
      if (bot.voiceStateCaching.members.includes(newState.member.id)) {
        bot.guild.channels.cache
          .get(bot.defaultTextChannel.id)
          .send(
            `Look at this twat ${newState.member} joining a voice chat then leaving immediately!`
          );
      }
      bot.voiceStateCaching.members = bot.voiceStateCaching.members.filter(
        (val) => val != newState.member.id
      );
      if (bot.voiceStateCaching.timeouts[newState.member.id] != null) {
        clearTimeout(bot.voiceStateCaching.timeouts[newState.member.id]);
      }
      if (
        bot.guild.channels.cache.get(oldState.channel.id).members.array()
          .length == 1 &&
        bot.voiceChannel
      ) {
        if (bot.dispatcher) {
          bot.audioQueue = [];
          bot.dispatcher.end();
          bot.dispatcher = false;
        }
        try {
          bot.voiceChannel.leave();
        } catch {
          bot.guild.channels.cache.get(bot.voiceChannel.id).leave();
        }
        bot.voiceChannel = false;
        bot.voiceConnection = false;
        status.eSender.socket.emit("sendBotInfo", [utils.dumbifyBot(bot)]);
      }
      return;
    }
    bot.voiceStateCaching.members.push(newState.member.id);
    bot.voiceStateCaching.timeouts[newState.member.id] = setTimeout(() => {
      bot.voiceStateCaching.members = bot.voiceStateCaching.members.filter(
        (val) => val != newState.member.id
      );
    }, 3 * 1000);
    if (!oldState.channel) return;
  } catch (error) {
    log(`Error handling voiceStateUpdate event"\n` + error, [
      "[WARN]",
      "[MAIN]",
      `[${bot.guildName}]`,
    ]);
  }
});

//discord.js client event for when a user's presence updates.
status.client.on("presenceUpdate", (oldPresence, newPresence) => {
  if (oldPresence.status == newPresence.status) return;
  if (newPresence.status == "online") {
    delete status.client.lastSeen[newPresence.user.id];
    return;
  } else {
    status.client.lastSeen[newPresence.user.id] = utils.getTimeRaw();
    return;
  }
});

//UI & backend communication event handlers (not really sure how else to word this)
function cmd(e, arg) {
  if (!arg) arg = e;
  switch (arg[0]) {
    case "refreshcmds": {
      utils.systemCMDs(arg[0], status);
      break;
    }
    case "refreshadmin": {
      for (let bot of status.client.children.array()) {
        utils.systemCMDs(arg[0], bot);
      }
      break;
    }
    case "kill": {
      utils.systemCMDs(arg[0], status);
      break;
    }
    default:
      return;
  }
  return;
}
ipcMain.on("command", cmd);

function updateBot(e, bot) {
  if (!bot) bot = e;
  for (let i of status.client.children.array()) {
    if (i.guildID == bot.guildID) {
      i.defaultTextChannel = bot.defaultTextChannel;
      i.defaultVoiceChannel = bot.defaultVoiceChannel;
      i.defaultVolume = bot.defaultVolume;
      i.ruleTextChannel = bot.ruleTextChannel;
      i.welcomeTextChannel = bot.welcomeTextChannel;
      i.welcomeMsg = bot.welcomeMsg;
      i.announcementsRole = bot.announcementsRole;
      i.newMemberRole = bot.newMemberRole;
      utils.saveConfig(i);
    }
  }
  if (status.eSender.socket !== false) {
    status.eSender.socket.emit("updateBotUI", bot);
  }
  if (status.eSender.ipc !== false) {
    status.eSender.ipc.send("updateBotUI", utils.dumbifyBot(bot));
  }
}
ipcMain.on("updateBot", updateBot);

function updateVol(bot) {
  status.eSender.ipc.send("updateVol", utils.dumbifyBot(bot));
  status.eSender.socket.emit("sendBotInfo", [utils.dumbifyBot(bot)]);
}

ipcMain.once("init-eSender", (event, arg) => {
  status.eSender.ipc = event.sender;
});

//discord.js client login (called when the electron window is open and ready)
let loginAtt = 0;
function clientLogin(t) {
  loginAtt++;
  log(`Logging in... attempt: ${loginAtt}`, ["[INFO]", "[MAIN]"]);
  try {
    status.client.login(t);
    log(`Login successful!`, ["[INFO]", "[MAIN]"]);
  } catch (error) {
    if (loginAtt <= 5) {
      log(`Error logging in client. Trying again in 5s...`, [
        "[WARN]",
        "[MAIN]",
      ]);
      setTimeout(function () {
        clientLogin(t);
      }, 5000);
    } else log(`Error logging in client:\n` + error, ["[ERR]", "[MAIN]"]);
  }
}
