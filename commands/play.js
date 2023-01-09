//Play command. Plays given youtube or soundcloud URL (or searches youtube with given terms) in the voice channel of
//the command sender (or default if none)

const ytdl = require("ytdl-core");
const sc = require("soundcloud-downloader").default;
const fetch = require("node-fetch");
const request = require("superagent");

const utils = require("../utils.js");
const { fs } = require("../main.js");
const prefix = utils.config.prefix;

const API_KEY = require("../tokens.json").TOKEN_YT;
const SC_API_KEY = require("../tokens.json").TOKEN_SC;
const SP_CLIENT_ID = require("../tokens.json").SP_CLIENT_ID;
const SP_CLIENT_SECRET = require("../tokens.json").SP_CLIENT_SECRET;
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
    let s;
    if (params.WS) {
      s = params.interaction.args.search;
    } else {
      s = params.interaction.options.getString("search");
    }
    search(s, mem, params);
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

function getSpotifyToken() {
  let params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", SP_CLIENT_ID);
  params.append("client_secret", SP_CLIENT_SECRET);
  fetch("https://accounts.spotify.com/api/token", {
    method: "post",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  })
    .then((response) => response.json())
    .then((res) => {
      utils.dumpJSON("temp2.json", res, 2);
      return res.access_token;
    });
}

function search(str, mem, params) {
  let status = params.bot;
  let url = str;
  let resType;
  switch (url.includes("http")) {
    case true: {
      if (
        !(
          url.includes(".youtube.com/") ||
          url.includes("soundcloud.com/") ||
          url.includes("spotify.com/")
        )
      ) {
        return status.guild.channels.cache
          .get(status.defaultTextChannel.id)
          .send(`${mem} That was not a youtube, soundcloud, or spotify link.`);
      }
      let plID;
      let requestURL;
      let tasks = [];
      try {
        switch (url.includes("list=")) {
          case true: {
            resType = "yt-pl";
            plID = getParameterByName("list", url);
            requestURL = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=20&key=${API_KEY}&playlistId=${plID}`;
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
                    params
                  );
                });
              });
              worker(status, tasks);
            });
            break;
          }
          case false: {
            if (!url.includes("/playlist/")) break;
            resType = "sp-pl";
            plID = url.split("/").reverse()[0].split("?")[0];
            log(plID, ["[WARN]", "[PLAY]"]);
            return;
            let spotifyReqURL = `https://api.spotify.com/v1/playlists/${plID}`;
            status.guild.channels.cache
              .get(status.defaultTextChannel.id)
              .send(
                `${mem} Hold onto your butts! I've got a Spotify playlist inbound...`
              );
            request(spotifyReqURL, (error, response) => {
              if (error || !response.statusCode == 200) {
                log("Error getting spotify playlist info", [
                  "[WARN]",
                  "[PLAY]",
                ]);
                return;
              }
              response.body.tracks.items.forEach((i) => {
                tasks.push(() => {
                  search(`${i.name} ${i.artists[0].name}`, mem, params);
                });
              });
            });
            break;
          }
        }
      } catch {
        return status.guild.channels.cache
          .get(status.defaultTextChannel.id)
          .send(`${mem} That link was broken or incomplete.`);
      }
      if (url.includes("/track/")) {
        plID = url.split("/").reverse()[0].split("?")[0];
        let token = getSpotifyToken();
        log(token, ["[WARN]", "[PLAY]"]);
        let spotifyReqURL = `https://api.spotify.com/v1/tracks/${plID}`;
        fetch(spotifyReqURL, {
          method: "get",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })
          .then((response) => response.json())
          .then((res) => {
            utils.dumpJSON("temp.json", res, 2);
            search(`${res.name} ${res.artists[0].name}`, mem, params);
            return;
          })
          .catch((err) => {
            log(`Error getting spotify song info: ${err}`, [
              "[WARN]",
              "[PLAY]",
            ]);
          });
      }
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
            get_info(url, mem, params);
            break;
          }
        }
      });
      break;
    }
  }
}

let errcount = 0;
async function get_info(url, mem, params) {
  let status = params.bot;
  let vidInfo = {};
  if (url.toString().includes("soundcloud.com/")) {
    vidInfo.videoDetails = await sc.getInfo(url, SC_API_KEY);
    vidInfo.trackSource = "SC";
    vidInfo.videoDetails.lengthSeconds = Math.trunc(
      vidInfo.videoDetails.duration / 1000
    );
    vidInfo.videoDetails.title += ` - ${vidInfo.videoDetails.user.username}`;
    vidInfo.imgURL = vidInfo.videoDetails.artwork_url;
  } else if (url.toString().includes(".youtube.com/")) {
    try {
      vidInfo = await ytdl.getInfo(url);
    } catch (err) {
      throw err;
    }
    vidInfo.trackSource = "YT";
    vidInfo.imgURL = vidInfo.videoDetails.thumbnails.pop().url;
  }
  vidInfo.url = url;
  vidInfo.added_by = mem.displayName;
  if (!status.voiceConnection) {
    joinCMD.execute(params);
    status.voiceConnection.once(voice.VoiceConnectionStatus.Ready, () => {
      play(vidInfo, status);
    });
  } else if (!!status.dispatcher && status.dispatcher.playing) {
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
  info.videoDetails.startedAt = Date.now();
  status.nowPlaying = info;
  createStream(status, info);
}

function createStream(status, info) {
  let str;
  try {
    switch (info.trackSource) {
      case "YT": {
        str = ytdl.downloadFromInfo(info, { filter: "audioonly" });
        status.dispatcher = voice.createAudioPlayer({
          behaviors: { noSubscriber: voice.NoSubscriberBehavior.Stop },
        });
        status.dispatcher.playing = true;
        status.dispatcher.paused = false;
        status.voiceConnection.subscribe(status.dispatcher);
        status.dispatcher.play(voice.createAudioResource(str));
        status.dispatcher.once(voice.AudioPlayerStatus.Idle, () => {
          endDispatcher(status);
        });
        status.dispatcher.once("error", (err) => {
          log(`Audio stream error:\n${err}`, ["[ERR]", "[PLAY]"]);
        });
        break;
      }
      case "SC": {
        sc.download(info.url, SC_API_KEY).then((stream) => {
          stream.pipe(fs.createWriteStream(`temp${status.guildID}.mp3`));
          stream.on("end", () => {
            str = `./temp${status.guildID}.mp3`;
            status.dispatcher = voice.createAudioPlayer({
              behaviors: { noSubscriber: voice.NoSubscriberBehavior.Stop },
            });
            status.dispatcher.playing = true;
            status.dispatcher.paused = false;
            status.voiceConnection.subscribe(status.dispatcher);
            status.dispatcher.play(voice.createAudioResource(str));
            status.dispatcher.once(voice.AudioPlayerStatus.Idle, () => {
              endDispatcher(status);
              fs.unlinkSync(str);
            });
            status.dispatcher.once("error", (err) => {
              log(`Audio stream error:\n${err}`, ["[ERR]", "[PLAY]"]);
              fs.unlinkSync(str);
            });
          });
        });
        break;
      }
    }
  } catch (err) {
    log(`Caught audio stream error:\n${err}`, ["[ERR]", "[PLAY]"]);
  }
  utils.informClients(status, {
    audioQueue: status.audioQueue,
    nowPlaying: status.nowPlaying,
  });
}

function endDispatcher(status) {
  if (status.audioQueue && status.audioQueue.length === 0) {
    try {
      status.dispatcher.stop();
    } catch {}
    status.dispatcher = false;
    status.nowPlaying = false;
    utils.informClients(status, {
      audioQueue: status.audioQueue,
      nowPlaying: false,
      paused: false,
    });
    status.guild.channels.cache
      .get(status.defaultTextChannel.id)
      .send("Audio queue is empty.");
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
  nextPlay.videoDetails.startedAt = Date.now();
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
