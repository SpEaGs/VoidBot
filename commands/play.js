//Play command. Plays given youtube or soundcloud URL (or searches youtube with given terms) in the voice channel of
//the command sender (or default if none)

const ytdl = require("ytdl-core");
const sc = require("soundcloud-downloader").default;
const fetch = require("node-fetch");
const request = require("superagent");

const utils = require("../utils.js");
const { fs } = require("../main.js");

const API_KEY = require("../tokens.json").TOKEN_YT;
const SC_API_KEY = require("../tokens.json").TOKEN_SC;
const SP_CLIENT_ID = require("../tokens.json").SP_CLIENT_ID;
const SP_CLIENT_SECRET = require("../tokens.json").SP_CLIENT_SECRET;
const { SlashCommandBuilder } = require("discord.js");
const voice = require("@discordjs/voice");
const joinCMD = require("./join");

const CacheFile = require("../models/cachefile.js");

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
  usage: `\`/play <URL or search terms>\``,
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

function search(str, mem, params, verbose = true) {
  let status = params.bot;
  let url = str;
  switch (url.includes("http")) {
    case true: {
      let plID;
      let requestURL;
      let tasks = [];
      switch (true) {
        case url.includes("youtube.com/"): {
          try {
            if (url.includes("list=:")) {
              plID = getParameterByName("list", url);
              requestURL = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=20&key=${API_KEY}&playlistId=${plID}`;
              status.guild.channels.cache
                .get(status.defaultTextChannel.id)
                .send(
                  `${mem} Hold onto your butts! I've got a playlist inbound...`
                );
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
            } else {
              get_info(url, mem, params);
              break;
            }
          } catch {
            return status.guild.channels.cache
              .get(status.defaultTextChannel.id)
              .send(`${mem} That Youtube link was incomplete or broken.`);
          }
        }
        case url.includes("spotify.com/"): {
          try {
            switch (true) {
              case url.includes("/album/"): {
                alID = url.split("/").reverse()[0].split("?"[0]);
                status.guilds.channels.cache
                  .get(status.defaultTextChannel.id)
                  .send(
                    `${mem} Hold onto your butts! I've got a Spotify album inbound...`
                  );
                let urlparams = new URLSearchParams();
                let token;
                urlparams.append("grant_type", "client_credentials");
                urlparams.append("client_id", SP_CLIENT_ID);
                urlparams.append("client_secret", SP_CLIENT_SECRET);
                fetch("https://accounts.spotify.com/api/token", {
                  method: "post",
                  headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                  },
                  body: urlparams,
                })
                  .then((response) => response.json())
                  .then((res) => {
                    token = res["access_token"];
                    let spotifyReqURL = `https://api.spotify.com/v1/albums/${alID}`;
                    fetch(spotifyReqURL, {
                      method: "get",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                    })
                      .then((response) => response.json())
                      .then((res) => {
                        res.tracks.items
                          .forEach((i) => {
                            tasks.push(() => {
                              search(
                                `${i.track.name} ${i.track.artists[0].name}`,
                                mem,
                                params,
                                false
                              );
                            });
                            worker(status, tasks);
                            return;
                          })
                          .catch((err) => {
                            log(`Error getting spotify album info: ${err}`, [
                              "[WARN]",
                              "[PLAY]",
                            ]);
                          });
                      });
                  });
                break;
              }
              case url.includes("/playlist/"): {
                plID = url.split("/").reverse()[0].split("?")[0];
                status.guild.channels.cache
                  .get(status.defaultTextChannel.id)
                  .send(
                    `${mem} Hold onto your butts! I've got a Spotify playlist inbound...`
                  );
                let urlparams = new URLSearchParams();
                let token;
                urlparams.append("grant_type", "client_credentials");
                urlparams.append("client_id", SP_CLIENT_ID);
                urlparams.append("client_secret", SP_CLIENT_SECRET);
                fetch("https://accounts.spotify.com/api/token", {
                  method: "post",
                  headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                  },
                  body: urlparams,
                })
                  .then((response) => response.json())
                  .then((res) => {
                    token = res["access_token"];
                    let spotifyReqURL = `https://api.spotify.com/v1/playlists/${plID}`;
                    fetch(spotifyReqURL, {
                      method: "get",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                    })
                      .then((response) => response.json())
                      .then((res) => {
                        res.tracks.items.forEach((i) => {
                          tasks.push(() => {
                            search(
                              `${i.track.name} ${i.track.artists[0].name}`,
                              mem,
                              params,
                              false
                            );
                          });
                        });
                        worker(status, tasks);
                        return;
                      })
                      .catch((err) => {
                        log(`Error getting spotify playlist info: ${err}`, [
                          "[WARN]",
                          "[PLAY]",
                        ]);
                      });
                  });
                break;
              }
              case url.includes("/track/"): {
                plID = url.split("/").reverse()[0].split("?")[0];
                let urlparams = new URLSearchParams();
                let token;
                urlparams.append("grant_type", "client_credentials");
                urlparams.append("client_id", SP_CLIENT_ID);
                urlparams.append("client_secret", SP_CLIENT_SECRET);
                fetch("https://accounts.spotify.com/api/token", {
                  method: "post",
                  headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                  },
                  body: urlparams,
                })
                  .then((response) => response.json())
                  .then((res) => {
                    token = res["access_token"];
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
                        search(
                          `${res.name} ${res.artists[0].name}`,
                          mem,
                          params
                        );
                        return;
                      })
                      .catch((err) => {
                        log(`Error getting spotify song info: ${err}`, [
                          "[WARN]",
                          "[PLAY]",
                        ]);
                      });
                  });
                break;
              }
              default: {
                return status.guild.channels.cache
                  .get(status.defaultTextChannel.id)
                  .send(`${mem} That was not a supported Spotify link.`);
              }
            }
            break;
          } catch {
            return status.guild.channels.cache
              .get(status.defaultTextChannel.id)
              .send(`${mem} That Spotify link was incomplete or broken.`);
          }
        }
        case url.includes("soundcloud.com/"): {
          get_info(url, mem, params);
          break;
        }
        default: {
          return status.guild.channels.cache
            .get(status.defaultTextChannel.id)
            .send(
              `${mem} That was not a pure Youtube, Soundcloud, or Spotify link.`
            );
        }
      }
      break;
    }
    case false: {
      CacheFile.findOne({ $or: [{ title: url }, { url: url }] }).then(
        (result) => {
          if (result) {
            if (!status.voiceConnection) {
              joinCMD.execute(params);
              status.voiceConnection.once(
                voice.VoiceConnectionStatus.Ready,
                () => {
                  play(result, false, mem, status);
                }
              );
            }
            if (!!status.dispatcher && status.dispatcher.playing) {
              addToQueue(result, false, mem, status);
            } else {
              play(result, false, mem, status);
            }
          } else {
            let requestUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${escape(
              url
            )}&key=${API_KEY}`;
            if (verbose)
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
          }
        }
      );
      break;
    }
  }
}

let errcount = 0;
async function get_info(url, mem, params) {
  let status = params.bot;
  const info = { url: url };
  let details = {};
  switch (true) {
    case url.toString().includes("soundcloud.com/"): {
      try {
        details = await sc.getInfo(url, SC_API_KEY);
      } catch (err) {
        throw err;
      }
      info.trackSource = "SC";
      info.duration = Math.trunc(details.duration / 1000);
      info.title = `${details.title} - ${details.user.username}`;
      info.imgURL = details.artwork_url;
      break;
    }
    case url.toString().includes(".youtube.com/"): {
      try {
        details = await ytdl.getInfo(url);
      } catch (err) {
        throw err;
      }
      info.trackSource = "YT";
      info.duration = details.videoDetails.lengthSeconds;
      info.title = details.videoDetails.title;
      info.imgURL = details.videoDetails.thumbnails.pop().url;
      break;
    }
  }
  const dbinfo = new CacheFile(info);
  dbinfo.NOD = `${dbinfo._id}.${dbinfo.trackSource === "YT" ? "m4a" : "mp3"}`;
  dbinfo.save().then(() => {
    if (!status.voiceConnection) {
      joinCMD.execute(params);
      status.voiceConnection.once(voice.VoiceConnectionStatus.Ready, () => {
        play(dbinfo, details, mem, status);
      });
    } else if (!!status.dispatcher && status.dispatcher.playing) {
      addToQueue(dbinfo, details, mem, status);
    } else {
      play(dbinfo, details, mem, status);
    }
  });
}

function play(info, details, mem, status) {
  status.guild.channels.cache
    .get(status.defaultTextChannel.id)
    .send(
      `Playing song: \`${info.title} [${parseInt(info.duration / 60)}:${(
        info.duration % 60
      )
        .toString()
        .padStart(2, "0")}] (added by: ${mem.displayName})\``
    );
  info.lastPlayed = Date.now();
  status.nowPlaying = { ...info._doc, added_by: mem.displayName };
  createStream(info, details, status);
}

function makeDispatcherFromFile(info, status) {
  console.log("file");
  status.dispatcher = voice.createAudioPlayer({
    behaviors: { noSubscriber: voice.NoSubscriberBehavior.Stop },
  });
  status.dispatcher.playing = true;
  status.dispatcher.paused = false;
  status.voiceConnection.subscribe(status.dispatcher);
  status.dispatcher.play(
    voice.createAudioResource(`/mnt/raid5/voidbot/audiocache/${info.NOD}`)
  );
  status.dispatcher.once(voice.AudioPlayerStatus.Idle, () => {
    log("Voice Idle.", ["[WARN]", "[PLAY]", `[${status.guildName}]`]);
    endDispatcher(status);
  });
  status.dispatcher.once("error", (err) => {
    log(`Audio steam error:\n${err}`, [
      "[ERR]",
      "[PLAY]",
      `[${status.guildName}]`,
    ]);
  });
}

function makeDispatcher(stream, info, status) {
  console.log("download");
  let filename = `/mnt/raid5/voidbot/audiocache/${info.NOD}`;
  stream.pipe(fs.createWriteStream(filename));
  stream.on("end", () => {
    console.log(info);
    const dbinfo = new CacheFile(info);
    dbinfo.NOD = `${dbinfo._id}.${dbinfo.trackSource === "YT" ? "m4a" : "mp3"}`;
    dbinfo.save().then(() => {
      status.dispatcher = voice.createAudioPlayer({
        behaviors: { noSubscriber: voice.NoSubscriberBehavior.Stop },
      });
      utils.informAllClients(status.status, {
        audioCache: { remove: false, info: info },
      });
      status.dispatcher.playing = true;
      status.dispatcher.paused = false;
      status.voiceConnection.subscribe(status.dispatcher);
      status.dispatcher.play(voice.createAudioResource(filename));
      status.dispatcher.once(voice.AudioPlayerStatus.Idle, () => {
        log("Voice Idle.", ["[WARN]", "[PLAY]", `[${status.guildName}]`]);
        endDispatcher(status);
      });
      status.dispatcher.once("error", (err) => {
        log(`Audio stream error:\n${err}`, [
          "[ERR]",
          "[PLAY]",
          `[${status.guildName}]`,
        ]);
      });
    });
  });
}

function createStream(info, details, status) {
  if (!details) {
    makeDispatcherFromFile(info, status);
  } else {
    try {
      switch (info.trackSource) {
        case "YT": {
          let stream = ytdl.downloadFromInfo(details, { filter: "audioonly" });
          makeDispatcher(stream, info, status);
          break;
        }
        case "SC": {
          sc.download(info.url, SC_API_KEY).then((stream) => {
            makeDispatcher(stream, info, status);
          });
          break;
        }
      }
    } catch (err) {
      log(`Caught audio stream error:\n${err}`, ["[ERR]", "[PLAY]"]);
    }
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
  if (!status.audioQueue.length) return endDispatcher(status);
  const { details, mem } = status.audioQueue[0];
  CacheFile.findOne({ _id: status.audioQueue[0].info._id }).then((info) => {
    status.guild.channels.cache
      .get(status.defaultTextChannel.id)
      .send(
        `Now Playing: \`${info.title} [${parseInt(info.duration / 60)}:${(
          info.duration % 60
        )
          .toString()
          .padStart(2, "0")}] (added by: ${mem.displayName})\``
      );
    info.lastPlayed = Date.now();
    status.nowPlaying = { ...info._doc, added_by: mem.displayName };
    status.audioQueue.shift();
    createStream(info, details, status);
  });
}

function addToQueue(info, details, mem, status) {
  status.guild.channels.cache
    .get(status.defaultTextChannel.id)
    .send(
      `Added \`${info.title} [${parseInt(info.duration / 60)}:${(
        info.duration % 60
      )
        .toString()
        .padStart(2, "0")}]\` to the queue.`
    );
  log(`Adding ${info.title} to queue.`, [
    "[INFO]",
    "[PLAY]",
    `[${status.guildName}]`,
  ]);
  if (!status.audioQueue) status.audioQueue = [];
  status.audioQueue.push({ info: info._doc, details: details, mem: mem });
  utils.informClients(status, { audioQueue: status.audioQueue });
}
