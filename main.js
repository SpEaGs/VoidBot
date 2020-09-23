
const Discord = require('discord.js');
const winston = require('winston');
const fs = require('fs');

const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;
const path = require('path');
const url = require('url');

const token = require('./tokens.json').TOKEN;

const utils = require('./utils.js');
const Bot = require('./bot.js');

let mainWindow;

//log formatting and pipes to log files
var logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});
logger.add(new winston.transports.Console({
    format: winston.format.simple()
}));

//init some vars & export
module.exports = {
    eSender: false,
    client: false,
    fs: fs,
    systemUIPopulated: false,
    settingsUIPopulated: false
}

//set up basic structure for calling/storing discord.js clients (master + children)
const status = require('./main.js');
status.client = new Discord.Client();
status.client.children = new Discord.Collection();
status.client.cmds = new Discord.Collection();

//wraps logger to a function so that console output can also be sent to the UI
function log(str) {
    logger.info(utils.getTime()+str);
    if (status.eSender !== false) {
        status.eSender.send('stdout', utils.getTime()+str);
    };
};
function logErr(str) {
    logger.error(utils.getTime()+str);
    if (status.eSender !== false) {
        status.eSender.send('stdout', utils.getTime()+str);
    };
};
global.log = log;
global.logErr = logErr;

//discord.js client ready event handler (master client)
try {
    status.client.once('ready', () => {
        utils.populateCmds(status);
        
        //populate info for child clients
        let guilds = status.client.guilds.cache.array();
        for (let i of guilds) {
            let id = i.id;
            let newBot = new Bot.Bot(i, status);
            status.client.children.set(id, newBot);
            utils.populateAdmin(newBot);
            for (let chan of newBot.guild.channels.cache.array()) {
                let cleanChanName = utils.cleanChannelName(chan.name);
                switch (chan.type) {
                    case "voice": {
                        newBot.voiceChannelArray.push({ id: chan.id, name: chan.name, cName: cleanChanName }); break;
                    }
                    case "text": {
                        newBot.textChannelArray.push({ id: chan.id, name: chan.name, cName: cleanChanName }); break;
                    }
                }
            }
            for (let role of newBot.guild.roles.cache.array()) {
                let cleanRoleName = utils.cleanChannelName(role.name);
                newBot.roleArray.push({ id: role.id, name: role.name, cName: cleanRoleName });
            }
            status.eSender.send('add-client', newBot);
            log(`[${newBot.guildName}] Initialization complete!`);
        }
        log('[MAIN] VoidBot Ready! Hello World!');
    });
}
catch (error) {
    logErr(`[MAIN] Error initializing client:\n`+error);
    process.exit(1);
};

/*discord.js client message event handler (only need to listen to this once so the master sends the info 
to wherever it needs to go (i.e. which child client should handle it/do something with it)*/
status.client.on('message', msg => {
    let bot = status.client.children.get(msg.guild.id);
    //log incoming message & check for bot message or command
    log(`[${bot.guildName}] [${msg.channel.name}] [${msg.author.username}]: ${msg}`)
    if (msg.author.id == status.client.user.id) return;
    if (!msg.content.startsWith(utils.config.prefix)) return;
    if (msg.channel.id != bot.defaultTextChannel.id) {
        msg.delete({reason:"Wrong channel for bot commands."});
        bot.guild.channels.cache.get(bot.defaultTextChannel.id).send(utils.wrongChannel(msg.author));
        return;
    }

    //parse for command arguments
    const args = msg.content.slice(utils.config.prefix.length).split(/ +/);
    const cmdName = args.shift().toLowerCase();

    //fetch admin lists & compare user id
    let admin = utils.adminCheck(bot, msg.author);
    let botadmin = utils.botAdminCheck(msg.author.id);
    let adminCheck = false;
    if (admin || botadmin) adminCheck = true;
    log(`[MAIN] Admin: ${admin} | Botadmin: ${botadmin}`);

    //check system commands & run if found (these are commands related to the bot, not things it does.)
    if (botadmin) {
        var sysCmd = utils.systemCMDs(cmdName, status);
        if (sysCmd) return;
    }

    //check for command alias, arguments, and admin
    let aliCheck = utils.aliasCheck(cmdName, status);
    if (!status.client.cmds.has(cmdName) && !aliCheck) return msg.reply('Command not recognized.');
    let cmd = aliCheck;
    if (!aliCheck) cmd = status.client.cmds.get(cmdName);
    if (cmd.server && msg.channel.type !== 'text') return msg.reply('That command only works on a server!');
    if (cmd.args && !args.length) return msg.reply(`That command needs arguments.\nUsage: ${cmd.usage}`);
    if (cmd.admin && !adminCheck) return msg.reply('You do not have sufficient permissions to use that command you fool!');
            
    //run command
    try {
        let params = { msg, args, bot };
        cmd.execute(params);
    }
    catch (error) {
        logErr(`[${bot.guildName}] Error executing command:\n`+error);
        msg.reply('There was an error executing that command! Please ask `SpEaGs#2936` to check the logs.');
    };
});

//discord.js client event for new members joining a server
status.client.on('guildMemberAdd', member => {
    let bot = status.client.children.get(member.guild.id);
    try {
        if (bot.welcomeMsg == false) return;
        if (bot.wlecomeTextChannel != false) {
            let anno = false;
            if (bot.announcementsRole != false) anno = true;
            if (bot.ruleTextChannel != false) {
                bot.guild.channels.cache.get(bot.welcomeTextChannel.id).send(utils.welcome(member, anno)
                +`\nPlease read the rules in ${bot.guild.channels.cache.get(bot.ruleTextChannel.id).toString()}`);
            }
            else bot.guild.channels.cache.get(bot.welcomeTextChannel.id).send(utils.welcome(member, anno));
        };
        if (bot.newMemberRole != false) {
            member.roles.add(bot.newMemberRole.id);
        }
    }
    catch (error) {
        logErr(`[${bot.guildName}] Error handling guildMemberAdd event:\n`+error);
    };
});

//discord.js client event for when a member leaves a server
status.client.on('guildMemberRemove', member => {
    let bot = status.client.children.get(member.guild.id);
    try {
        if (bot.welcomeMsg == false) return;
        if (bot.welcomeTextChannel != false) {
            bot.guild.channels.cache.get(bot.welcomeTextChannel.id).send(utils.sendoff(member));
        }
    }
    catch (error) {
        logErr(`[${bot.guildName}] Error handling guildMemberRemove event:\n`+error);
    };
});

//discord.js client event for when a guild member updates voice status (join/leave/mute/unmute/deafen/undeafen)
status.client.on('voiceStateUpdate', (oldMember, newMember) => {
    let bot = status.client.children.get(newMember.guild.id);
    try {
        if (!oldMember.voiceChannel) return;
        if (newMember.voiceChannel != oldMember.voiceChannel
            && bot.guild.channels.cache.get(oldMember.voiceChannel.id).members.array().length == 1
            && bot.voiceChannel) {
            if (bot.dispatcher) {
                bot.audioQueue = [];
                bot.dispatcher.end();
                bot.dispatcher = false;
            }
            bot.voiceChannel.leave();
            bot.voiceChannel = false;
            bot.voiceConnection = false;
            return;
        }
    }
    catch (error) {
        logErr(`[${bot.guildName}]Error handling voiceStateUpdate event"\n`+error);
    };
});

//set up electron window
function createWindow() {
    let bounds = utils.config.windowState.bounds;
    let max = utils.config.windowState.max;
    let x, y, wid, hei;
    if (bounds) {
        let area = electron.screen.getPrimaryDisplay().workArea;
        if (
            bounds.x >= area.x &&
            bounds.y >= area.y &&
            bounds.x + bounds.width <= area.x + area.width &&
            bounds.y + bounds.height <= area.y + area.height
        ) {
            x = bounds.x;
            y = bounds.y;
        }
        if (bounds.width <= area.width || bounds.height <= area.height) {
            wid = bounds.width;
            hei = bounds.height;
        }
        else { wid = 1080, hei = 720, x = 0, y = 0 }
    }
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        x: x,
        y: y,
        width: wid,
        height: hei,
        minWidth: 1080,
        minHeight: 620,
        frame: false
    });
    if (max) mainWindow.maximize();
    if (process.env.NODE_ENV == 'development') mainWindow.webContents.openDevTools();
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname,'index.html'),
        protocol: 'file',
        slashes: true
    }));
    mainWindow.webContents.once('dom-ready', () => { clientLogin(token); });
    mainWindow.on('closed', () => { mainWindow = null; });
    mainWindow.on('resize', saveBoundsSoon);
    mainWindow.on('move', saveBoundsSoon);
}

//event handlers for electron window
app.once('ready', () => { createWindow(); });

app.once('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) createWindow();
});

let saveBoundsCookie;
function saveBoundsSoon() {
    if (saveBoundsCookie) clearTimeout(saveBoundsCookie);
    saveBoundsCookie = setTimeout(() => {
        saveBoundsCookie = undefined;
        utils.config.windowState.bounds = mainWindow.getNormalBounds();
        utils.config.windowState.max = mainWindow.isMaximized();
        utils.dumpJSON('./config.json', utils.config, 2)
    }, 1000);
}

//UI & backend communication event handlers (not really sure how else to word this)
ipcMain.on('command', (event, arg) => {
    switch (arg[0]) {
        case 'refreshcmds': {
            utils.systemCMDs(arg[0], status);
            break;
        }
        case 'refreshadmin': {
            for (let bot of status.client.children.array()) {
                utils.systemCMDs(arg[0], bot);
            }
            break;
        }
        case 'kill': {
            utils.systemCMDs(arg[0], status);
            break;
        }
        default: return;
    }
    return;
});

ipcMain.on('updateBot', (event, bot) => {
    for (let i of status.client.children.array()) {
        if (i.guildID == bot.guildID) {
            i = bot;
            utils.saveConfig(i);
        }
    }
})

ipcMain.once('init-eSender', (event, arg) => { status.eSender = event.sender; });

//discord.js client login (called when the electron window is open and ready)
let loginAtt = 0
function clientLogin(t) {
    loginAtt++;
    log(`[MAIN] Logging in... attempt: ${loginAtt}`);
    try {
        status.client.login(t);
        log(`[MAIN] Login successful!`);
    }
    catch (error) {
        if (loginAtt <= 5) {
            logErr(`Error logging in client. Trying again in 5s...`);
            setTimeout(function(){clientLogin(t)}, 5000);
        }
        else logErr(`[MAIN] Error logging in client:\n`+error);
    }
}