//Play command. Plays given youtube or soundcloud URL (or searches youtube with given terms) in the voice channel of
//the command sender (or default if none)

const ytdl = require("ytdl-core");
const sc = require("soundcloud-downloader").default;
const fetch = require("node-fetch");
const request = require("superagent");

const utils = require("../utils.js");
const { fs } = require("../main.js");

const { log, warn, err } = require("../logger");

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
  async execute(params) {
    if (!params.WS)
      await params.interaction.reply({ content: "Command received!" });
    let mem = params.interaction.member;
    let s;
    if (params.WS) {
      s = params.interaction.args.search;
    } else {
      s = params.interaction.options.getString("search");
    }
    try {
      search(s, mem, params);
    } catch {
      return params.WS
        ? params.bot.guild.channels.cache
            .get(params.bot.defaultTextChannel.id)
            .send(
              `${mem} There was an uncaught error somewhere. This is usually related to a youtube video being private, age restricted, or unavailable in the US.`
            )
        : params.interaction.editReply({
            content: `${mem} There was an uncaught error somewhere. This is usually related to a youtube video being private, age restricted, or unavailable in the US.`,
          });
    }
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

function worker(bot, taskList = [], interval = 1000) {
  if (interval > 1000) interval = 1000;
  if (!bot.dispatcher) interval = 3000;
  log("remaining: " + taskList.length, ["[PLAY-Worker]"]);
  taskList[0]();
  taskList.shift();
  if (!!taskList.length) {
    setTimeout(() => {
      worker(bot, taskList, interval);
    }, interval);
  }
}

function search(str, mem, params, verbose = true) {
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
              params.WS
                ? bot.guild.channels.cache
                    .get(bot.defaultTextChannel.id)
                    .send(
                      `${mem} Hold onto your butts! I've got a playlist inbound...`
                    )
                : params.interaction.editReply({
                    content: `${mem} Hold onto your butts! I've got a playlist inbound...`,
                  });
              request(requestURL, (error, response) => {
                if (error || !response.statusCode == 200) {
                  warn("Error getting playlist info", ["[PLAY]"]);
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
                worker(bot, tasks);
              });
              break;
            } else {
              get_info(url, mem, params);
              break;
            }
          } catch {
            return params.WS
              ? bot.guild.channels.cache
                  .get(bot.defaultTextChannel.id)
                  .send(`${mem} That Youtube link was incomplete or broken.`)
              : params.interaction.editReply({
                  content: `${mem} That Youtube link was incomplete or broken.`,
                });
          }
        }
        case url.includes("spotify.com/"): {
          try {
            switch (true) {
              case url.includes("/album/"): {
                alID = url.split("/").reverse()[0].split("?"[0]);
                params.WS
                  ? bot.guilds.channels.cache
                      .get(bot.defaultTextChannel.id)
                      .send(
                        `${mem} Hold onto your butts! I've got a Spotify album inbound...`
                      )
                  : params.interaction.editReply({
                      content: `${mem} Hold onto your butts! I've got a Spotify album inbound...`,
                    });
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
                            worker(bot, tasks);
                            return;
                          })
                          .catch((err) => {
                            warn(`Error getting spotify album info: ${err}`, [
                              "[PLAY]",
                            ]);
                          });
                      });
                  });
                break;
              }
              case url.includes("/playlist/"): {
                plID = url.split("/").reverse()[0].split("?")[0];
                params.WS
                  ? bot.guild.channels.cache
                      .get(bot.defaultTextChannel.id)
                      .send(
                        `${mem} Hold onto your butts! I've got a Spotify playlist inbound...`
                      )
                  : params.interaction.editReply({
                      content: `${mem} Hold onto your butts! I've got a Spotify playlist inbound...`,
                    });
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
                        worker(bot, tasks);
                        return;
                      })
                      .catch((err) => {
                        warn(`Error getting spotify playlist info: ${err}`, [
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
                        warn(`Error getting spotify song info: ${err}`, [
                          "[PLAY]",
                        ]);
                      });
                  });
                break;
              }
              default: {
                return params.WS
                  ? bot.guild.channels.cache
                      .get(bot.defaultTextChannel.id)
                      .send(`${mem} That was not a supported Spotify link.`)
                  : params.interaction.editReply({
                      content: `${mem} That was not a supported Spotify link.`,
                    });
              }
            }
            break;
          } catch {
            return params.WS
              ? bot.guild.channels.cache
                  .get(bot.defaultTextChannel.id)
                  .send(`${mem} That Spotify link was incomplete or broken.`)
              : params.interaction.editReply({
                  content: `${mem} That Spotify link was incomplete or broken.`,
                });
          }
        }
        case url.includes("soundcloud.com/"): {
          get_info(url, mem, params);
          break;
        }
        default: {
          return params.WS
            ? bot.guild.channels.cache
                .get(bot.defaultTextChannel.id)
                .send(
                  `${mem} That was not a pure Youtube, Soundcloud, or Spotify link.`
                )
            : params.interaction.editReply({
                content: `${mem} That was not a pure Youtube, Soundcloud, or Spotify link.`,
              });
        }
      }
      break;
    }
    case false: {
      CacheFile.findOne({ url: url }).then(async (result) => {
        if (!result) {
          result = await CacheFile.findOne({ $text: { $search: url } });
        }
        if (result) {
          if (!bot.voiceConnection) {
            await joinCMD.execute(params);
            bot.voiceConnection.once(voice.VoiceConnectionStatus.Ready, () => {
              play(result, false, mem, bot);
            });
          }
          if (!!bot.dispatcher && bot.dispatcher.playing) {
            addToQueue(result, false, mem, bot);
          } else {
            play(result, false, mem, bot);
          }
        } else {
          let requestUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${escape(
            url
          )}&key=${API_KEY}`;
          if (verbose)
            params.WS
              ? bot.guild.channels.cache
                  .get(bot.defaultTextChannel.id)
                  .send(`${mem} Searching Youtube for \`${url}\`...`)
              : params.interaction.editReply({
                  content: `${mem} Searching Youtube for \`${url}\`...`,
                });
          request(requestUrl, (error, response) => {
            if (error || !response.statusCode == 200) {
              warn(`Error getting video info`, ["[PLAY]"]);
              return;
            }
            let body = response.body;
            if (body.items.length == 0) {
              params.WS
                ? bot.guild.channels.cache
                    .get(bot.defaultTextChannel.id)
                    .send(`${mem} I got nothing... try being less specific?`)
                : params.interaction.editReply({
                    content: `${mem} I got nothing... try being less specific?`,
                  });
              log(`0 results from search.`, ["[PLAY]", `[${bot.guild.name}]`]);
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
      });
      break;
    }
  }
}

let errcount = 0;
async function get_info(url, mem, params) {
  const info = { url: url, stats: new utils.AudioStats() };
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
  info.stats.addedBy = mem.id;
  const dbinfo = new CacheFile(info);
  dbinfo.NOD = `${dbinfo._id}.${dbinfo.trackSource === "YT" ? "m4a" : "mp3"}`;
  dbinfo.save().then(async () => {
    if (!params.bot.voiceConnection) {
      await joinCMD.execute(params);
      params.bot.voiceConnection.once(voice.VoiceConnectionStatus.Ready, () => {
        play(dbinfo, details, mem, params.bot);
      });
    } else if (!!params.bot.dispatcher && params.bot.dispatcher.playing) {
      addToQueue(dbinfo, details, mem, params.bot);
    } else {
      play(dbinfo, details, mem, params.bot);
    }
  });
}

function play(info, details, mem, bot) {
  bot.guild.channels.cache
    .get(bot.defaultTextChannel.id)
    .send(
      `Playing song: \`${info.title} [${parseInt(info.duration / 60)}:${(
        info.duration % 60
      )
        .toString()
        .padStart(2, "0")}] (added by: ${mem.displayName})\``
    );
  info.stats.lastPlayed = Date.now();
  info.stats.lastPlayedBy = mem.id;
  info.stats.timesPlayed += 1;
  info.stats.timesPlayedSinceLastReport += 1;
  if (!info.stats.addedBy) info.stats.addedBy = mem.id;
  info.save().then(() => {
    bot.nowPlaying = { ...info._doc, added_by: mem.displayName };
    bot.audioStats.plays += 1;
    bot.audioStats.playsSinceLastReport += 1;
    createStream(info, details, bot);
  });
}

function makeDispatcherFromFile(info, bot) {
  bot.dispatcher = voice.createAudioPlayer({
    behaviors: { noSubscriber: voice.NoSubscriberBehavior.Stop },
  });
  bot.dispatcher.playing = true;
  bot.dispatcher.paused = false;
  bot.voiceConnection.subscribe(bot.dispatcher);
  bot.dispatcher.play(
    voice.createAudioResource(`/mnt/raid5/voidbot/audiocache/${info.NOD}`)
  );
  bot.dispatcher.once(voice.AudioPlayerStatus.Idle, () => {
    warn("Voice Idle.", ["[PLAY]", `[${bot.guild.name}]`]);
    endDispatcher(bot);
  });
  bot.dispatcher.once("error", (err) => {
    warn(`Audio steam error:\n${err}`, ["[PLAY]", `[${bot.guild.name}]`]);
  });
}

function makeDispatcher(stream, info, bot) {
  let filename = `/mnt/raid5/voidbot/audiocache/${info.NOD}`;
  stream.pipe(fs.createWriteStream(filename));
  stream.on("end", () => {
    const dbinfo = new CacheFile(info);
    dbinfo.NOD = `${dbinfo._id}.${dbinfo.trackSource === "YT" ? "m4a" : "mp3"}`;
    dbinfo.downloaded = true;
    dbinfo.save().then(() => {
      bot.dispatcher = voice.createAudioPlayer({
        behaviors: { noSubscriber: voice.NoSubscriberBehavior.Stop },
      });
      utils.informAllClients(bot.status, {
        audioCache: { remove: false, info: info },
      });
      bot.dispatcher.playing = true;
      bot.dispatcher.paused = false;
      bot.voiceConnection.subscribe(bot.dispatcher);
      bot.dispatcher.play(voice.createAudioResource(filename));
      bot.dispatcher.once(voice.AudioPlayerStatus.Idle, () => {
        warn("Voice Idle.", ["[PLAY]", `[${bot.guild.name}]`]);
        endDispatcher(bot);
      });
      bot.dispatcher.once("error", (err) => {
        warn(`Audio stream error:\n${err}`, ["[PLAY]", `[${bot.guild.name}]`]);
      });
    });
  });
}

function createStream(info, details, bot) {
  if (!details) {
    makeDispatcherFromFile(info, bot);
  } else {
    try {
      switch (info.trackSource) {
        case "YT": {
          let stream = ytdl.downloadFromInfo(details, { filter: "audioonly" });
          makeDispatcher(stream, info, bot);
          break;
        }
        case "SC": {
          sc.download(info.url, SC_API_KEY).then((stream) => {
            makeDispatcher(stream, info, bot);
          });
          break;
        }
      }
    } catch (err) {
      warn(`Caught audio stream error:\n${err}`, ["[PLAY]"]);
    }
  }
  utils.informClients(bot, {
    audioQueue: bot.audioQueue,
    nowPlaying: bot.nowPlaying,
  });
}

function endDispatcher(bot) {
  if ((bot.audioQueue && bot.audioQueue.length === 0) || !bot.audioQueue) {
    try {
      bot.dispatcher.stop();
    } catch {}
    bot.dispatcher = false;
    bot.nowPlaying = false;
    utils.informClients(bot, {
      audioQueue: bot.audioQueue,
      nowPlaying: false,
      paused: false,
    });
    bot.guild.channels.cache
      .get(bot.defaultTextChannel.id)
      .send("Audio queue is empty.");
    return;
  } else {
    playNextInQueue(bot);
  }
}

function playNextInQueue(bot) {
  log(`Playing next in queue - length:${bot.audioQueue.length}`, [
    "[PLAY]",
    `[${bot.guild.name}]`,
  ]);
  if (!bot.audioQueue.length) return endDispatcher(bot);
  const { details, mem } = bot.audioQueue[0];
  CacheFile.findOne({ _id: bot.audioQueue[0].info._id }).then((info) => {
    bot.guild.channels.cache
      .get(bot.defaultTextChannel.id)
      .send(
        `Now Playing: \`${info.title} [${parseInt(info.duration / 60)}:${(
          info.duration % 60
        )
          .toString()
          .padStart(2, "0")}] (added by: ${mem.displayName})\``
      );
    info.stats.lastPlayed = Date.now();
    info.stats.lastPlayedBy = mem.id;
    info.stats.timesPlayed += 1;
    info.stats.timesPlayedSinceLastReport += 1;
    if (!info.stats.addedBy) info.stats.addedBy = mem.id;
    info.save().then(() => {
      bot.nowPlaying = { ...info._doc, added_by: mem.displayName };
      bot.audioQueue.shift();
      bot.audioStats.plays += 1;
      bot.audioStats.playsSinceLastReport += 1;
      createStream(info, details, bot);
    });
  });
}

function addToQueue(info, details, mem, bot) {
  bot.guild.channels.cache
    .get(bot.defaultTextChannel.id)
    .send(
      `Added \`${info.title} [${parseInt(info.duration / 60)}:${(
        info.duration % 60
      )
        .toString()
        .padStart(2, "0")}]\` to the queue.`
    );
  log(`Adding ${info.title} to queue.`, ["[PLAY]", `[${bot.guild.name}]`]);
  if (!bot.audioQueue) bot.audioQueue = [];
  bot.audioQueue.push({ info: info._doc, details: details, mem: mem });
  utils.informClients(bot, { audioQueue: bot.audioQueue });
}
