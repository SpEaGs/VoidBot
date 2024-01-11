const db = require("mongoose");

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
  NOD: {
    type: String,
  },
  lastPlayed: {
    type: Number,
  },
});

CacheFile.index({ title: "text" });
module.exports = db.model("CacheFile", CacheFile);
