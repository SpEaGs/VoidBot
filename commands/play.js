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
const { SlashCommandBuilder } = require("discord.js");
const { urlencoded } = require("express");
const voice = require("@discordjs/voice");
const joinCMD = require("./join");

let name = "Play";
let description = "Plays a given YT or SC URL (or from YT search terms).";

module.exports = {
  data: new SlashCommandBuilder()
    .setName(name.toLowerCase())
    .setDescription(description)
    .addStringOption((option) =>
      option
        .setName("search")
        .setDescription("URL or search terms.")
        .setRequired(true)
    ),
  name: name,
  description: description,
  args: true,
  usage: `\`${prefix}play <URL or search terms>\``,
  admin: false,
  botadmin: false,
  server: true,
  playNextInQueue: playNextInQueue,
  execute(params) {
    let log = global.log;
    let mem = params.interaction.member;
    search(
      params.interaction.options.getString("search"),
      mem,
      params.bot,
      params.interaction
    );
  },
};

function getParameterByName(name, url) {
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function worker(status, taskList = [], interval = 1000) {
  if (interval > 1000) interval = 1000;
  if (!status.dispatcher) interval = 3000;
  log("remaining: " + taskList.length, ["[INFO]", "[PLAY-Worker]"]);
  taskList[0]();
  taskList.shift();
  if (!!taskList.length) {
    setTimeout(() => {
      worker(status, taskList, interval);
    }, interval);
  }
}

function search(str, mem, status, interaction) {
  let url = str;
  switch (url.includes("http")) {
    case true: {
      if (!(url.includes(".youtube.com/") || url.includes("soundcloud.com/"))) {
        return status.guild.channels.cache
          .get(status.defaultTextChannel.id)
          .send(`${mem} That was not a youtube or soundcloud link.`);
      }
      if (url.includes("list=")) {
        let plID = getParameterByName("list", url);
        if (!plID || plID === "") {
          return status.guild.channels.cache
            .get(status.defaultTextChannel.id)
            .send(`${mem} That link was broken or incomplete.`);
        }
        let requestURL = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=20&key=${API_KEY}&playlistId=${plID}`;
        status.guild.channels.cache
          .get(status.defaultTextChannel.id)
          .send(`${mem} Hold onto your butts! I've got a playlist inbound...`);
        let tasks = [];
        request(requestURL, (error, response) => {
          if (error || !response.statusCode == 200) {
            log("Error getting playlist info", ["[WARN], [PLAY]"]);
            return;
          }
          response.body.items.forEach((i) => {
            tasks.push(() => {
              get_info(
                "https://www.youtube.com/watch?v=" +
                  i.snippet.resourceId.videoId,
                mem,
                status,
                interaction
              );
            });
          });
          worker(status, tasks);
        });
      } else get_info(url, mem, status, interaction);
      break;
    }
    case false: {
      let requestUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${escape(
        url
      )}&key=${API_KEY}`;
      status.guild.channels.cache
        .get(status.defaultTextChannel.id)
        .send(`${mem} Searching Youtube for \`${url}\`...`);
      request(requestUrl, (error, response) => {
        if (error || !response.statusCode == 200) {
          log(`Error getting video info`, ["[WARN]", "[PLAY]"]);
          return;
        }
        let body = response.body;
        if (body.items.length == 0) {
          status.guild.channels.cache
            .get(status.defaultTextChannel.id)
            .send(`${mem}I got nothing... try being less specific?`);
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
            get_info(url, mem, status, interaction);
            break;
          }
        }
      });
      break;
    }
  }
}

let errcount = 0;
async function get_info(url, mem, status, interaction) {
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
    vidInfo.imgURL = vidInfo.videoDetails.thumbnails.pop().url;
  }
  vidInfo.url = url;
  vidInfo.added_by = mem.displayName;
  if (!status.voiceConnection) {
    return joinCMD.execute({ bot: status, interaction: interaction }, () => {
      play(vidInfo, status);
    });
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
      status.dispatcher = voice.createAudioPlayer({
        behaviors: { noSubscriber: voice.NoSubscriberBehavior.Stop },
      });
      status.voiceConnection.subscribe(status.dispatcher);
      status.dispatcher.play(voice.createAudioResource(str));
      status.dispatcher.on(voice.AudioPlayerStatus.Idle, () => {
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
  utils.informClients(status, {
    audioQueue: status.audioQueue,
    nowPlaying: status.nowPlaying,
  });
}

function endDispatcher(status) {
  if (status.audioQueue && status.audioQueue.length === 0) {
    status.dispatcher = false;
    status.nowPlaying = false;
    utils.informClients(status, {
      audioQueue: status.audioQueue,
      nowPlaying: false,
      paused: false,
    });
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
  if (!nextPlay) {
    return endDispatcher(status);
  }
  status.guild.channels.cache
    .get(status.defaultTextChannel.id)
    .send(
      `Now Playing: \`${nextPlay.videoDetails.title} [${parseInt(
        nextPlay.videoDetails.lengthSeconds / 60
      )}:${(nextPlay.videoDetails.lengthSeconds % 60)
        .toString()
        .padStart(2, "0")}] (added by: ${nextPlay.added_by})\``
    );
  status.nowPlaying = nextPlay;
  status.audioQueue.shift();
  createStream(status, nextPlay);
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
  utils.informClients(status, { audioQueue: status.audioQueue });
}
