const db = require("mongoose");

const passportLocalDB = require("passport-local-mongoose");

const User = new db.Schema({
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
  botAdmin: {
    type: Boolean,
    default: false,
  },
});

User.plugin(passportLocalDB);

module.exports = db.model("User", User);
