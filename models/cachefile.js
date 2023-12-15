const db = require("mongoose");

const CacheFile = new db.Schema({});

module.exports = db.model("CacheFile", CacheFile);
