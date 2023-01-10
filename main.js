const keys = require("./tokens.json");
const token = keys.TOKEN;
const cookieKey = keys.COOKIE_KEY;

const Discord = require("discord.js");
const winston = require("winston");
const fs = require("fs");

const express = require("express");
const session = require("express-session");
const cors = require("cors");
const api = express();
const server = require("http").createServer(api);
const io = require("socket.io")(server, {
  cors: {
    origin: "http://voidbot.speags.com:2053",
    methods: ["GET", "POST"],
  },
});
const passport = require("passport");
const User = require("./web/models/user");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const utils = require("./utils.js");
const Bot = require("./bot.js");
const intents = new Discord.IntentsBitField([
  Discord.IntentsBitField.Flags.Guilds,
  Discord.IntentsBitField.Flags.GuildMembers,
  Discord.IntentsBitField.Flags.GuildPresences,
  Discord.IntentsBitField.Flags.GuildVoiceStates,
]);
//init some vars & export
module.exports = {
  client: new Discord.Client({
    forceFetchUsers: true,
    intents: intents,
  }),
  fs: fs,
  systemUIPopulated: false,
  settingsUIPopulated: false,
  getStatus: getStatus,
  webAppDomain: utils.config.webAppDomain,
  sockets: new Discord.Collection(),
  consoleSockets: new Discord.Collection(),
};

const status = require("./main.js");

function getStatus() {
  return status;
}

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

//wraps logger to a function so that console output can also be sent to the UI
function log(str, tags) {
  let lo = { timeStamp: utils.getTime(), tags: tags, msg: str };
  let l = `${lo.timeStamp} ${lo.tags.join(" ")}: ${lo.msg}`;
  switch (tags[0]) {
    case "[INFO]": {
      logger.info(l);
      break;
    }
    case "[WARN]": {
      logger.warn(l);
      break;
    }
    case "[ERR]": {
      logger.error(l);
      break;
    }
  }
  status.consoleSockets.forEach((s) => {
    s.emit("stdout_check");
    s.once("stdout_auth", (snowflake) => {
      if (utils.config.botAdmin.includes(snowflake)) {
        s.emit("stdout", lo);
      }
    });
  });
  backlog.push(lo);
}
global.log = log;

require("./web/utils/connectdb");
require("./web/passport-setup");

status.client.children = new Discord.Collection();
status.client.cmds = new Discord.Collection();
status.client.lastSeen = new Discord.Collection();

//webserver
function launchWebServer() {
  const whitelist = process.env.WHITELISTED_DOMAINS
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
  api.use(
    session({
      secret: cookieKey,
      resave: false,
      saveUninitialized: true,
      cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 },
    })
  );
  api.use(passport.initialize());
  api.use(passport.session());

  api.all("/", (req, res, next) => {
    res.header("Access-Control-AllowOrigin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-Width");
    next();
  });
  api.use("/auth", require("./web/routers/auth"));
  api.get("/", (req, res) => {
    if (!req.user) {
      res.redirect(utils.config.webAppDomain + "test");
    } else {
      res.redirect(
        `${utils.config.webAppDomain}token?dtoken=${req.user.token}`
      );
    }
  });

  function initSocket(s) {
    s.once("disconnect", () => {
      status.client.children.forEach((b) => {
        let found = b.socketSubs.get(s.id);
        if (!!found) {
          found.disconnect();
          b.socketSubs.delete(s.id);
        }
        let afound = b.adminSocketSubs.get(s.id);
        if (!!afound) {
          afound.disconnect();
          b.adminSocketSubs.delete(s.id);
        }
      });
    });
    s.on("guilds", (uToken) => {
      User.findOne({ token: uToken }, (err, u) => {
        if (err) return socket.disconnect();
        if (!u) return socket.disconnect();
        else {
          let guildsOut = [];
          status.client.children.forEach((b) => {
            if (u.guilds.member.includes(b.guildID)) {
              if (u.guilds.admin.includes(b.guildID)) {
                guildsOut.push(utils.dumbifyBot(b, true));
                b.adminSocketSubs.set(s.id, s);
              } else {
                guildsOut.push(utils.dumbifyBot(b));
              }
              b.socketSubs.set(s.id, s);
            }
          });
          s.emit("guilds_res", guildsOut);
        }
      });
    });
    s.on("user", (uToken) => {
      User.findOne({ token: uToken }, (err, u) => {
        if (err) return s.disconnect();
        if (!u) return s.disconnect();
        else {
          s.emit("user-res", u);
        }
      });
    });
    s.on("g_data", (payload) => {
      let bot = status.client.children.find(
        (bot) => bot.guildID === payload.id
      );
      if (payload.data) {
        for (let i of Object.keys(payload.data)) {
          bot[i] = payload.data[i];
        }
        switch (payload.admin) {
          case true: {
            utils.informAdminClients(bot, payload.data);
            utils.saveConfig(bot);
            break;
          }
          case false: {
            utils.informClients(bot, payload.data);
            utils.saveConfig(bot);
            break;
          }
        }
        return;
      }
      let mem = bot.guild.members.cache.get(payload.snowflake);
      let paramsOut = {
        interaction: { member: mem, args: {} },
        bot: bot,
        WS: true,
      };
      switch (payload.action) {
        case false || null || undefined:
          break;
        default:
          if (payload.aData) paramsOut.interaction.args = payload.aData;
          let cmd = status.client.cmds.get(payload.action);
          log(`${cmd.name} Command received from ${bot.guildName}`, [
            "[INFO]",
            `[${bot.guildName}]`,
          ]);
          cmd.execute(paramsOut);
          break;
      }
    });
  }

  io.on("connection", (socket) => {
    socket.once("get_backlog", (snowflake) => {
      if (utils.config.botAdmin.includes(snowflake)) {
        status.consoleSockets.set(socket.id, socket);
        socket.emit("backlog", backlog);
      }
    });
    socket.on("sysCMD", (payload) => {
      if (utils.config.botAdmin.includes(payload.snowflake)) {
        cmd(payload.cmd);
      }
    });
    socket.once("handshake_res", (authed, token, dToken = false) => {
      if (authed && dToken) {
        User.findOne({ token: dToken }, (err, u) => {
          if (err) return socket.disconnect();
          if (!u) {
            socket.emit("handshake_end", false);
            socket.disconnect();
          } else {
            let oldSocket = status.sockets.find((s) => s.token === token);
            if (!!oldSocket) {
              status.sockets.delete(oldSocket.socket.id);
            }
            initSocket(socket);
            status.sockets.set(socket.id, {
              socket: socket,
              token: token,
              dToken: dToken,
            });
            socket.emit("handshake_end", true, u);
          }
        });
      } else {
        socket.emit("handshake_end", false);
        socket.disconnect();
      }
    });
    socket.emit("handshake");
  });

  server.listen(process.env.PORT || 8081, () => {
    const port = server.address().port;
    log(`API started at port: ${port}`, ["[INFO]", "[WEBSERVER]"]);
  });
}

async function initBot(bot) {
  utils.populateAdmin(bot);
  utils.populateUsers(status, bot);
  bot.guild.channels.cache.forEach((chan) => {
    let cleanChanName = utils.cleanChannelName(chan.name);
    switch (chan.type) {
      case 2: {
        bot.voiceChannelArray.push({
          id: chan.id,
          name: chan.name,
          cName: cleanChanName,
        });
        break;
      }
      case 0: {
        bot.textChannelArray.push({
          id: chan.id,
          name: chan.name,
          cName: cleanChanName,
        });
        break;
      }
    }
  });
  bot.guild.roles.cache.forEach((role) => {
    if (role.id !== bot.guild.roles.everyone.id) {
      let cleanRoleName = utils.cleanChannelName(role.name);
      bot.roleArray.push({
        id: role.id,
        name: role.name,
        cName: cleanRoleName,
      });
    }
  });
}

//discord.js client ready event handler (master client)
try {
  status.client.once("ready", () => {
    //populate info for child clients
    status.client.guilds.cache.forEach((g) => {
      let newBot = new Bot.Bot(g, status);
      initBot(newBot);
      status.client.children.set(g.id, newBot);
      log("Initialization complete!", ["[INFO]", "[MAIN]", `[${g.name}]`]);
    });
    utils.populateCmds(status);

    setInterval(() => {
      status.consoleSockets.forEach((s) => {
        if (!s.connected) {
          status.consoleSockets.delete(s.id);
        }
      });
      status.sockets.forEach((s) => {
        if (!s.socket.connected) {
          status.sockets.delete(s.socket.id);
        }
      });
    }, 1000 * 60 * 5);

    status.client.on("interactionCreate", async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      let bot = status.client.children.get(interaction.guildId);
      //fetch admin lists & compare user id
      let admin = utils.adminCheck(bot, interaction.member.user);
      let botadmin = utils.botAdminCheck(interaction.member.user.id);
      let adminCheck = false;
      if (admin || botadmin) adminCheck = true;

      //get and run command
      let cmd = status.client.cmds.get(interaction.commandName.toLowerCase());
      if (cmd.admin && !adminCheck) {
        try {
          await interaction.reply(
            "You lack sufficient permissions for that command."
          );
        } catch {}
      } else {
        let member = bot.guild.members.cache.get(interaction.member.user.id);
        let msg = {
          author: member,
          member: member,
        };
        let params = { interaction, bot };
        cmd.execute(params);
        log(`${cmd.name} Command received from ${bot.guildName}`, [
          "[INFO]",
          `[${bot.guildName}]`,
        ]);
        try {
          await interaction.reply("Command received!");
        } catch {}
      }
    });
    setTimeout(() => {
      launchWebServer();
    }, 200);

    log("VoidBot Ready! Hello World!", ["[INFO]", "[MAIN]"]);
  });
} catch (error) {
  log(`Error initializing client:\n` + error, ["[ERR]", "[MAIN]"]);
  process.exit(1);
}

//discord.js client event for the bot entering a new server
status.client.on("guildCreate", async (guild) => {
  let guildOut = await status.client.guilds.fetch(guild.id);
  let newBot = new Bot.Bot(guildOut, status);
  log("New server added.", ["[INFO]", "[MAIN]", `[${newBot.guildName}]`]);
  status.client.children.set(guild.id, newBot);
  setTimeout(() => {
    initBot(newBot);
    log("Initialization complete!", [
      "[INFO]",
      "[MAIN]",
      `[${newBot.guildName}]`,
    ]);
  }, 400);
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
  if (oldState.member.id === status.client.user.id) return;
  if (
    !!oldState.channel &&
    !!newState.channel &&
    oldState.channel.id === newState.channel.id
  )
    return;
  if (!oldState.channel && !newState.channel) return;
  let bot = status.client.children.get(newState.guild.id);
  try {
    let cachedTimeout = bot.voiceStateTimeouts.get(newState.member.id);
    if (!newState.channel) {
      if (!!cachedTimeout) {
        bot.guild.channels.cache
          .get(bot.defaultTextChannel.id)
          .send(
            `Look at this twat ${newState.member} joining a voice chat then leaving immediately!`
          );
        clearTimeout(cachedTimeout);
        bot.voiceStateTimeouts.delete(newState.member.id);
      }
      if (oldState.channel.members.size == 1 && bot.voiceChannel) {
        status.client.cmds.get("leave").execute({ bot: bot });
      }
      return;
    }
    bot.voiceStateTimeouts.set(
      newState.member.id,
      setTimeout(() => {
        bot.voiceStateTimeouts.delete(newState.member.id);
      }, 1000 * 3)
    );
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
  if (!!oldPresence && oldPresence.status == newPresence.status) return;
  if (newPresence.status == "online")
    return status.client.lastSeen.delete(newPresence.user.id);
  else
    return status.client.lastSeen.set(newPresence.user.id, utils.getTimeRaw());
});

//UI & backend communication event handlers (not really sure how else to word this)
function cmd(e = "") {
  switch (e) {
    case "refreshcmds": {
      utils.populateCmds(status);
      break;
    }
    case "refreshadmin": {
      status.client.children.forEach((bot) => {
        utils.populateAdmin(status, bot);
      });
      break;
    }
    case "kill": {
      status.client.destroy();
      process.exit(0);
    }
    default:
      status.client.cmds
        .get("broadcast")
        .execute({ interaction: { args: { message: e } }, WS: true });
      break;
  }
  return;
}

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

process.on("uncaughtException", (err) => {
  if (err.captureStackTrace) err.captureStackTrace();
  log(
    `Uncaught exception:\n${err.name} position: ${err.lineNumber}:${err.columnNumber}\n${err.message}\n${err.stack}`,
    ["[ERR]", "[CRITICAL]"]
  );
  utils.dumpJSON("ERR_DUMP.json", err, 2);
  try {
    status.client.children.forEach((bot) => {
      utils.saveConfig(bot);
    });
    status.client.destroy();
    setTimeout(() => {
      process.exit(1);
    }, 3000);
  } catch {}
});

clientLogin(token);
