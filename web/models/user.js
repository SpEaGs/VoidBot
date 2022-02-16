const db = require("mongoose");
const { Schema } = db;

const passportLocalDB = require("passport-local-mongoose");

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
    type: {},
  },
  token: {
    type: String,
  },
});

User.plugin(passportLocalDB);

module.exports = db.model("User", User);
