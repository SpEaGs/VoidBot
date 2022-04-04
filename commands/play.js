//Play command. Plays given youtube or soundcloud URL (or searches youtube with given terms) in the voice channel of
//the command sender (or default if none)

const ytdl = require("ytdl-core");
const sc = require("soundcloud-downloader");
const request = require("superagent");

const utils = require("../utils.js");
const { fs } = require("../main.js");
const prefix = utils.config.prefix;

const API_KEY = require("../tokens.json").TOKEN_YT;
const SC_API_KEY = require("../tokens.json").TOKEN_SC;

const MAIN = require("../main.js");

let name = "play";
let description = "Plays a given YT or SC URL (or from YT search terms).";

module.exports = {
  name: name,
  description: description,
  alias: false,
  args: true,
  usage: `\`${prefix}play <URL or search terms>\``,
  admin: false,
  botadmin: false,
  server: true,
  playNextInQueue: playNextInQueue,
  execute(params) {
    let log = global.log;
    let mem = params.msg.member;
    params.bot.voiceChannel = params.msg.member.voice.channel;
    if (!params.bot.voiceChannel) {
      params.bot.voiceChannel = params.bot.guild.channels.cache.get(
        params.bot.defaultVoiceChannel.id
      );
    }
    if (!params.bot.voiceChannel) {
      log(`No voice channel specified and no default.`, [
        "[WARN]",
        "[PLAY]",
        `[${params.bot.guildName}]`,
      ]);
      try {
        return params.msg.reply(
          `I'm not in a voice channel, neither are you, and no default is set...`
        );
      } catch {
        return params.bot.guild.channels.cache
          .get(params.bot.defaultTextChannel.id)
          .send(
            `${mem} I'm not in a voice channel, neither are you, and no default is set...`
          );
      }
    }
    search(params.args, params.msg, params.bot);
  },
  regJSON: {
    name: name,
    description: description,
    options: [
      {
        name: "search",
        description: "URL or search terms.",
        type: 3,
        required: true,
      },
    ],
  },
};

function search(args, msg, status) {
  let url = args.toString();
  let mem = msg.member;
  switch (url.toString().includes("http")) {
    case true: {
      if (
        !(
          url.toString().includes(".youtube.com/") ||
          url.toString().includes("soundcloud.com/")
        )
      ) {
        try {
          return msg.reply(`That was not a youtube or soundcloud link.`);
        } catch {
          return status.guild.channels.cache
            .get(status.defaultTextChannel.id)
            .send(`${mem} That was not a youtube or soundcloud link.`);
        }
      } else get_info(url, msg, status);
      break;
    }
    case false: {
      let searchKwds = args.join(" ");
      let requestUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${escape(
        searchKwds
      )}&key=${API_KEY}`;
      try {
        msg.reply(`Searching Youtube for \`${searchKwds}\`...`);
      } catch {
        status.guild.channels.cache
          .get(status.defaultTextChannel.id)
          .send(`${mem} Searching Youtube for \`${searchKwds}\`...`);
      }
      request(requestUrl, (error, response) => {
        if (error || !response.statusCode == 200) {
          logErr(`Error getting video info`, `[${status.guildName}]`);
          return;
        }
        let body = response.body;
        if (body.items.length == 0) {
          try {
            msg.reply(`I got nothing... try being less specific?`);
          } catch {
            status.guild.channels.cache
              .get(status.defaultTextChannel.id)
              .send(`${mem}I got nothing... try being less specific?`);
          }
          log(`0 results from search.`, [
            "[INFO]",
            "[PLAY]",
            `[${status.guildName}]`,
          ]);
          return;
        }
        for (let i of body.items) {
          if (i.id.kind == "youtube#video") {
            url = "https://www.youtube.com/watch?v=" + i.id.videoId;
            get_info(url, msg, status);
            break;
          }
        }
      });
      break;
    }
  }
}

let errcount = 0;
async function get_info(url, msg, status) {
  let vidInfo = {};
  if (url.toString().includes("soundcloud.com/")) {
    vidInfo.videoDetails = await sc.getInfo(url, SC_API_KEY);
    vidInfo.trackSource = "SC";
    vidInfo.videoDetails.lengthSeconds = Math.trunc(
      vidInfo.videoDetails.duration / 1000
    );
    vidInfo.imgURL = vidInfo.videoDetails.artwork_url;
  } else if (url.toString().includes(".youtube.com/")) {
    vidInfo = await ytdl.getInfo(url);
    vidInfo.trackSource = "YT";
    vidInfo.imgURL = vidInfo.thumbnail_url;
  }
  vidInfo.url = url;
  vidInfo.added_by = msg.member.displayName;
  if (status.voiceConnection == false) {
    try {
      status.voiceChannel.join().then((connection) => {
        status.voiceConnection = connection;
        play(vidInfo, status);
      });
    } catch {
      status.guild.channels.cache
        .get(status.voiceChannel.id)
        .join()
        .then((connection) => {
          status.voiceConnection = connection;
          play(vidInfo, status);
        });
    }
    return;
  }
  if (status.dispatcher != false) {
    addToQueue(vidInfo, status);
  } else {
    play(vidInfo, status);
  }
}

function play(info, status) {
  status.guild.channels.cache
    .get(status.defaultTextChannel.id)
    .send(
      `Playing song: \`${info.videoDetails.title} [${parseInt(
        info.videoDetails.lengthSeconds / 60
      )}:${(info.videoDetails.lengthSeconds % 60)
        .toString()
        .padStart(2, "0")}] (added by: ${info.added_by})\``
    );
  status.nowPlaying = info;
  createStream(status, info);
}

function createStream(status, info) {
  let str;
  switch (info.trackSource) {
    case "YT": {
      str = ytdl.downloadFromInfo(info, { filter: "audioonly" });
      status.dispatcher = status.voiceConnection.play(str, {
        volume:
          parseFloat(utils.config.sharding[status.guildID].defaultVolume) / 100,
        passes: 2,
        bitrate: "auto",
      });
      status.dispatcher.on("finish", () => {
        endDispatcher(status);
      });
      break;
    }
    case "SC": {
      sc.download(info.url, SC_API_KEY).then((stream) => {
        stream.pipe(fs.createWriteStream(`temp${status.guildID}.mp3`));
        stream.on("end", () => {
          str = `./temp${status.guildID}.mp3`;
          status.dispatcher = status.voiceConnection.play(str, {
            volume:
              parseFloat(utils.config.sharding[status.guildID].defaultVolume) /
              100,
            passes: 2,
            bitrate: "auto",
          });
          status.dispatcher.on("finish", () => {
            endDispatcher(status);
            fs.unlinkSync(`./temp${status.guildID}.mp3`);
          });
        });
      });
      break;
    }
  }
}

function endDispatcher(status) {
  if (status.audioQueue && status.audioQueue.length === 0) {
    status.dispatcher = false;
    status.nowPlaying = false;
    return;
  } else {
    playNextInQueue(status);
  }
}

function playNextInQueue(status) {
  log(`Playing next in queue - length:${status.audioQueue.length}`, [
    "[INFO]",
    "[PLAY]",
    `[${status.guildName}]`,
  ]);
  let nextPlay = status.audioQueue[0];
  status.guild.channels.cache
    .get(status.defaultTextChannel.id)
    .send(
      `Now Playing: \`${nextPlay.videoDetails.title} [${parseInt(
        nextPlay.videoDetails.lengthSeconds / 60
      )}:${(nextPlay.videoDetails.lengthSeconds % 60)
        .toString()
        .padStart(2, "0")}] (added by: ${nextPlay.added_by})\``
    );
  createStream(status, nextPlay);
  status.nowPlaying = nextPlay;
  status.audioQueue.shift();
}

function addToQueue(info, status) {
  status.guild.channels.cache
    .get(status.defaultTextChannel.id)
    .send(
      `Added \`${info.videoDetails.title} [${parseInt(
        info.videoDetails.lengthSeconds / 60
      )}:${(info.videoDetails.lengthSeconds % 60)
        .toString()
        .padStart(2, "0")}]\` to the queue.`
    );
  log(`Adding ${info.videoDetails.title} to queue.`, [
    "[INFO]",
    "[PLAY]",
    `[${status.guildName}]`,
  ]);
  if (!status.audioQueue) status.audioQueue = [];
  status.audioQueue.push(info);
}
