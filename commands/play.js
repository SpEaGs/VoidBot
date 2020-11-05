//Play command. Plays given youtube or soundcloud URL (or searches youtube with given terms) in the voice channel of
//the command sender (or default if none)

const ytdl = require('ytdl-core');
const sc = require('soundcloud-downloader');
const request = require('superagent');

const utils = require('../utils.js');
const { fs } = require('../main.js');
const prefix = utils.config.prefix;

const API_KEY = require('../tokens.json').TOKEN_YT;
const SC_API_KEY = require('../tokens.json').TOKEN_SC;

module.exports = {
    name: 'play',
    description: 'Plays a given youtube or soundcloud URL (or from youtube search terms) in the voice channel of whomever sent the command.',
    alias: false,
    args: true,
    usage: `\`${prefix}play <URL or search terms>\``,
    admin: false,
    botadmin: false,
    server: true,
    playNextInQueue: playNextInQueue,
    execute(params) {
        let log = global.log;
        if (params.msg.channel.type == 'voice') return;
        params.bot.voiceChannel = params.msg.member.voice.channel;
        if (!params.bot.voiceChannel) {
            params.bot.voiceChannel = params.bot.guild.channels.cache.get(params.bot.defaultVoiceChannel.id);
        };
        if (!params.bot.voiceChannel) {
            log(`No voice channel specified and no default.`, `[${params.bot.guildName}]`);
            try { return params.msg.reply(`I'm not in a voice channel, neither are you, and no default is set...`) }
            catch(any) { return }
        };
        search(params.args, params.msg, params.bot);
    }
}

function search(args, msg, status) {
    let url = args.toString();
    switch (url.toString().includes('http')) {
        case true: {
            if (!(url.toString().includes('.youtube.com/') || url.toString().includes('soundcloud.com/'))) {
                try { return msg.reply(`That was not a youtube or soundcloud link.`)}
                catch(any) { return }
            }
            else get_info(url, msg, status);
            break;
        }
        case false: {
            let searchKwds = (args.join(' '));
            let requestUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${escape(searchKwds)}&key=${API_KEY}`;
            msg.reply('Searching Youtube with your query...');
            request(requestUrl, (error, response) => {
                if (error || !response.statusCode == 200) {
                    logErr(`Error getting video info`, `[${status.guildName}]`);
                    return;
                }
                let body = response.body;
                if (body.items.length == 0) {
                    msg.reply('I got nothing... try being less specific?');
                    log(`0 results from search.`, `[${status.guildName}]`);
                    return;
                }
                for (let i of body.items) {
                    if (i.id.kind == 'youtube#video') {
                        url = ('https://www.youtube.com/watch?v='+i.id.videoId);
                        get_info(url, msg, status);
                        break;
                    }
                }
            });
            break;
        }
    }
}

let errcount = 0
async function get_info(url, msg, status) {
    let vidInfo = {};
    if (url.toString().includes('soundcloud.com/')) {
        vidInfo = await sc.getInfo(url, SC_API_KEY);
        vidInfo.trackSource = 'SC';
        log(`d-${vidInfo.duration} -- f-${vidInfo.full_duration}`, `[${status.guildName}]`, `[DEBUG]`)
    }
    else if (url.toString().includes('.youtube.com/')) {
        vidInfo = (await ytdl.getInfo(url)).videoDetails;
        vidInfo.trackSource = 'YT';
    }
    vidInfo.url = url;
    vidInfo.added_by = msg.author.username;
    if (status.voiceConnection == false) {
        status.voiceChannel.join().then(connection => {
            status.voiceConnection = connection;
            play(vidInfo, status, msg);
        });
        return;
    }
    if (status.dispatcher != false) {
        addToQueue(vidInfo, status, msg);
        return;
    }
    else {
        play(vidInfo, status, msg);
    }
}

function play(info, status, msg) {
    msg.channel.send(`Playing song: \`${info.title} [${parseInt(info.lengthSeconds / 60)}:${(info.lengthSeconds % 60).toString().padStart(2, "0")}] (added by: ${info.added_by})\``);
    status.nowPlaying = info;
    createStream(status, info, msg);
}

function createStream(status, info, msg) {
    let str;
    switch (info.trackSource) {
        case 'YT': {
            str = ytdl.downloadFromInfo(info, { filter: 'audioonly' });
            status.dispatcher = status.voiceConnection.play(str, { volume: (parseFloat(utils.config.sharding[status.guildID].defaultVolume) / 100), passes: 2, bitrate: 'auto' });
            status.dispatcher.on('finish', () => { endDispatcher(status, msg); });
            break;
        }
        case 'SC': {
            sc.download(info.url, SC_API_KEY).then(stream => { 
                stream.pipe(fs.createWriteStream('temp.mp3'));
                stream.on('close', () => {
                    str = './temp.mp3';
                    status.dispatcher = status.voiceConnection.play(str, { volume: (parseFloat(utils.config.sharding[status.guildID].defaultVolume) / 100), passes: 2, bitrate: 'auto' });
                    status.dispatcher.on('finish', () => {
                        endDispatcher(status, msg);
                        fs.unlinkSync('./temp.mp3');
                    });
                })
            });
            break;
        }
    }
};

function endDispatcher(status, msg) {
    if (status.audioQueue && status.audioQueue.length === 0) {
        status.dispatcher = false;
        return;
    }
    else { playNextInQueue(status, msg); }
}

function playNextInQueue(status, msg) {
    log(`Playing next in queue - length:${status.audioQueue.length}`, `[${status.guildName}]`);
    let nextPlay = status.audioQueue[0];
    msg.channel.send(`Now Playing: \`${nextPlay.title} [${parseInt(nextPlay.lengthSeconds / 60)}:${(nextPlay.lengthSeconds % 60).toString().padStart(2, "0")}] (added by: ${nextPlay.added_by})\``);
    createStream(status, nextPlay, msg);
    status.nowPlaying = nextPlay;
    status.audioQueue.shift();
}

function addToQueue(info, status, msg) {
    msg.channel.send(`Added \`${info.title} [${parseInt(info.lengthSeconds / 60)}:${(info.lengthSeconds % 60).toString().padStart(2, "0")}]\` to the queue.`);
    log(`Adding ${info.title} to queue.`, `[${status.guildName}]`);
    if (!status.audioQueue) status.audioQueue = [];
    status.audioQueue.push(info);
}