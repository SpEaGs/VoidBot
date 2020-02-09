
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
const bot = require('./bot.js');

let mainWindow;

//this is just a log formatting thing
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
    logger.info(str);
    if (status.eSender !== false) {
        status.eSender.send('stdout', str);
    };
};
global.log = log;

//discord.js client ready event handler (master client)
status.client.on('ready', () => {
    utils.populateCmds(status);

    //populate info for child clients
    let guilds = status.client.guilds.array();
    for (let i of guilds) {
        let id = i.id;
        status.client.children.set(id, new bot.Bot(i, status));
    }

    //init child clients
    for (let bot of status.client.children.array()) {
        log(`[MAIN] Setting event listeners for client in: [${bot.guildName}]`);

        //discord.js client ready event handler (child clients)
        bot.client.on('ready', () => {
            log(`[${bot.guildName}] Successfully logged in!`);
            bot.guild = status.client.guilds.get(bot.guildID);
            utils.populateAdmin(bot, bot.guild);
            for (let chan of bot.guild.channels.array()) {
                let cleanChanName = utils.cleanChannelName(chan.name);
                switch (chan.type) {
                    case "voice": {
                        bot.voiceChannelArray.push({ id: chan.id, name: chan.name, cName: cleanChanName });
                        break;
                    }
                    case "text": {
                        bot.textChannelArray.push({ id: chan.id, name: chan.name, cName: cleanChanName });
                        break;
                    }
                }
            }
            for (let role of bot.guild.roles.array()) {
                let cleanRoleName = utils.cleanChannelName(role.name);
                bot.roleArray.push({id: role.id, name: role.name, cName: cleanRoleName });
            }
            status.eSender.send('add-client', bot);
            log(`[${bot.guildName}] Ready!`);
        });
    }

    log('[MAIN] Master Client Ready! Hello World!');
});

/*discord.js client message event handler (only need to listen to this once so the master sends the info 
to wherever it needs to go (i.e. which child client should handle it/do something with it)*/
status.client.on('message', msg => {
    for ( let bot of status.client.children.array()) {
        if (msg.guild.id == bot.guildID) {
            //log incoming message & check for bot message or command
            log(`[${bot.guildName}] [${msg.channel.name}] [${msg.author.username}]: ${msg}`)
            if (msg.author.id == status.client.user.id) return;
            if (!msg.content.startsWith(utils.config.prefix)) return;

            //parse for command arguments
            const args = msg.content.slice(utils.config.prefix.length).split(/ +/);
            const cmdName = args.shift().toLowerCase();

            //fetch admin lists & compare user id
            let admin = utils.adminCheck(bot.client, msg.author);
            let botadmin = utils.botAdminCheck(msg.author.id);
            let admincheck = false;
            if (admin || botadmin) admincheck = true;

            //check system commands & run if found (these are commands related to the bot, not things it does.)
            if (botadmin) {
                var sysCmd = utils.systemCMDs(cmdName, status);
                if (sysCmd) return;
            }

            //check for command alias, arguments, and admin
            let aliCheck = utils.aliasCheck(cmdName, status);
            if (!status.client.cmds.has(cmdName) && !aliCheck) return msg.reply('Command not recognized.');
            let cmd = aliCheck;
            let needAdmin = false;
            if (cmd.botadmin || cmd.admin) needAdmin = true;
            if (!aliCheck) cmd = status.client.cmds.get(cmdName);
            if (cmd.server && msg.channel.type !== 'text') return msg.reply('That command only works on a server!');
            if (cmd.args && !args.length) return msg.reply(`That command needs arguments.\nUsage: ${cmd.usage}`);
            if (needAdmin && !adminCheck) return msg.reply('You do not have sufficient permissions to use that command you fool!');
            
            //run command
            try {
                let params = { msg, args, bot };
                cmd.execute(params);
            }
            catch (error) {
                console.error(error);
                msg.reply('There was an error executing that command! Please check the logs for more info.');
            }
        }
    }
});

//discord.js client event for new members joining a server
status.client.on('guildMemberAdd', member => {
    for (let bot in status.client.children.array()) {
        if (member.guild.id == bot.guildID) {
            if (bot.defaultTextChannel != false) {
                let anno = false;
                if (bot.announcementsRole != false) anno = true;
                if (bot.ruleTextChannel != false) {
                    bot.client.channels.get(bot.defaultTextChannel.id).sendMessage(utils.welcome(member, anno)
                    +`\nPlease read the rules in ${bot.guild.channels.get(bot.ruleTextChannel.id).toString()}`);
                }
                else bot.client.channels.get(bot.defaultTextChannel.id).sendMessage(utils.welcome(member, anno));
            };
            if (utils.config.sharding[bot.guildID].newUserRole != false) {
                member.addRole(utils.config.sharding[bot.guildID].newUserRole.id);
            }
        }
    }
});

//discord.js client event for when a guild member updates voice status (join/leave/mute/unmute/deafen/undeafen)
status.client.on('voiceStateUpdate', (oldMember, newMember) => {
    for (let bot of status.client.children.array()) {
        if (!oldMember.voiceChannel) return;
        if (oldMember.guild.id == bot.guildID
            && oldMember.voiceChannel
            && newMember.voiceChannel != oldMember.voiceChannel
            && bot.guild.channels.find(val => val.id===oldMember.voiceChannel.id).members.array().length == 1
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
})

//set up electron window
function createWindow() {
    let bounds = utils.config.windowState.bounds
    let x, y, wid, hei;
    if (bounds) {
        let area = electron.screen.getDisplayMatching(bounds).workArea;
        if (
            bounds.x >= area.x &&
            bounds.y >= area.y &&
            bounds.x + bounds.width <= area.x + area.width &&
            bounds.y + bounds.height <= area.y + area.height
        ) {
            x = bounds.x;
            y = bounds.y
        }
        if (bounds.width <= area.width || bounds.height <= area.height) {
            wid = bounds.width;
            hei = bounds.height;
        }
        else { wid = 1080, hei = 720 }
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
app.on('ready', () => { createWindow(); });

app.on('window-all-closed', () => {
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
        utils.dumpJSON('config.json', utils.config, 2);
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

ipcMain.on('init-eSender', (event, arg) => { status.eSender = event.sender; });

//discord.js client login (called when the electron window is open and ready)
function clientLogin(t) {
    status.client.login(t);
}