const db = require("mongoose");
const { Schema } = db;

const passportLocalDB = require("passport-local-mongoose");

const Session = new Schema({
  refreshToken: {
    type: String,
    default: "",
  },
});

const Guilds = new Schema({
  admin: {
    type: [],
    default: false,
  },
  member: {
    type: [],
  },
});

const User = new Schema({
  snowflake: {
    type: String,
    default: "",
  },
  username: {
    type: String,
    default: "",
  },
  discriminator: {
    type: String,
    default: "",
  },
  guilds: {
    type: Guilds,
  },
  refreshToken: {
    type: [Session],
  },
});

User.set("toJSON", {
  transform: (doc, ret, options) => {
    delete ret.refreshToken;
    return ret;
  },
});

User.plugin(passportLocalDB);

module.exports = db.model("User", User);
