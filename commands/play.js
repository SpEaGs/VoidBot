//Play command. Plays given youtube URL (or searches youtube with given terms) in the voice channel of
//the command sender (or default if none)

const ytdl = require('ytdl-core');
const request = require('superagent');

const utils = require('../utils.js');
const prefix = utils.config.prefix;

const API_KEY = require('../tokens.json').TOKEN_YT;

module.exports = {
    name: 'play',
    description: 'Plays a given youtube URL (or from search terms) in the voice channel of whomever sent the command.',
    alias: false,
    args: true,
    usage: `\`${prefix}play <URL or search terms>\``,
    admin: false,
    botadmin: false,
    server: true,
    playNextInQueue: playNextInQueue,
    execute(params) {
        let url = params.args;
        let log = global.log;
        if (params.msg.channel.type == 'voice') return;
        params.bot.voiceChannel = params.msg.member.voice.channel;
        if (!params.bot.voiceChannel) {
            params.bot.voiceChannel = params.bot.guild.channels.cache.get(params.bot.defaultVoiceChannel.id);
        };
        if (!params.bot.voiceChannel) {
            log(`[${params.bot.guildName}] No voice channel specified and no default.`);
            try { return params.msg.reply(`I'm not in a voice channel, neither are you, and no default is set...`) }
            catch(any) { return }
        };
        ytSearch(params.args, params.msg, params.bot);
    }
}

function ytSearch(args, msg, status) {
    let url = args.toString();
    switch (url.toString().includes('http')){
        case true: {
            get_yt_info(url, msg, status);
            break;
        }
        case false: {
            let searchKwds = (args.join(' '));
            let requestUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${escape(searchKwds)}&key=${API_KEY}`;
            msg.reply('Searching Youtube with your query...');
            request(requestUrl, (error, response) => {
                if (error || !response.statusCode == 200) {
                    logErr(`[${status.guildName}] Error getting video info`);
                    return;
                }
                let body = response.body;
                if (body.items.length == 0) {
                    msg.reply('I got nothing... try being less specific?');
                    log(`[${status.guildName}] 0 results from search.`);
                    return;
                }
                for (let i of body.items) {
                    if (i.id.kind == 'youtube#video') {
                        url = ('https://www.youtube.com/watch?v='+i.id.videoId);
                        get_yt_info(url, msg, status);
                        break;
                    }
                }
            });
            break;
        }
    }
}

function get_yt_info(url, msg, status) {
    let vidInfo = [];
    ytdl.getInfo(url, (error, info) => {
        if (error) {
            logErr(`[${status.guildName}] Error ( ${url} ): ${error}`);
            return;
        }
        vidInfo = info;
        vidInfo.url = url;
        vidInfo.added_by = msg.author.username;
        if (status.voiceConnection == false) {
            status.voiceChannel.join().then(connection => {
                status.voiceConnection = connection;
                play(vidInfo, status, msg);
            });
            return;
        };
        if (status.dispatcher != false) {
            addToQueue(vidInfo, status, msg);
            return;
        }
        else {
            play(vidInfo, status, msg);
        }
    });
}

function play(info, status, msg) {
    msg.channel.send(`Playing song: \`${info.title} [${parseInt(info.length_seconds / 60)}:${(info.length_seconds % 60).toString().padStart(2, "0")}] (added by: ${info.added_by})\``);
    status.nowPlaying = info;
    createStream(status, info.url, msg);
}

function createStream(status, url, msg) {
    const stream = ytdl(url, { filter: 'audioonly' });
    if (process.env.NODE_ENV == 'development') { stream.on('error', console.error) }
    status.dispatcher = status.voiceConnection.play(stream, { volume: (parseFloat(utils.config.sharding[status.guildID].defaultVolume) / 100), passes: 2, bitrate: 'auto' });
    status.dispatcher.on('finish', () => { endDispatcher(status, msg); });
};

function endDispatcher(status, msg) {
    if (status.audioQueue && status.audioQueue.length === 0) {
        status.dispatcher = false;
        return;
    }
    else { playNextInQueue(status, msg); }
}

function playNextInQueue(status, msg) {
    log(`[${status.guildName}] Playing next in queue - length:${status.audioQueue.length}`);
    let nextPlay = status.audioQueue[0];
    msg.channel.send(`Now Playing: \`${nextPlay['title']} [${parseInt(nextPlay.length_seconds / 60)}:${(nextPlay.length_seconds % 60).toString().padStart(2, "0")}] (added by: ${nextPlay.added_by})\``);
    createStream(status, nextPlay.url, msg);
    status.nowPlaying = nextPlay;
    status.audioQueue.shift();
}

function addToQueue(info, status, msg) {
    msg.channel.send(`Added \`${info.title} [${parseInt(info.length_seconds / 60)}:${(info.length_seconds % 60).toString().padStart(2, "0")}]\` to the queue.`);
    log(`[${status.guildName}] Adding ${info.title} to queue.`);
    if (!status.audioQueue) status.audioQueue = [];
    status.audioQueue.push(info);
}