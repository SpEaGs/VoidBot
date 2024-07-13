const db = require("mongoose");
const { AudioStats } = require("../utils");

const CacheFile = new db.Schema({
  url: {
    type: String,
  },
  trackSource: {
    type: String,
  },
  duration: {
    type: Number,
  },
  title: {
    type: String,
  },
  imgURL: {
    type: String,
  },
  downloaded: {
    type: Boolean,
    default: false,
  },
  stats: {
    type: Object,
    default: new AudioStats(),
  },
  NOD: {
    type: String,
  },
  lastPlayed: {
    type: Number,
  },
});

CacheFile.index({ title: "text" });
module.exports = db.model("CacheFile", CacheFile);
