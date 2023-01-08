const db = require("mongoose");
const url = process.env.MONGO_DB_CONNECTION_STRING;
const connect = db.connect(url);
const log = global.log;

connect
  .then((db) => {
    log("Connected to DB", ["[INFO]", "[WEBSERVER]"]);
  })
  .catch((err) => {
    log(`Error connecting to DB: ${err}`, ["[ERR]", "[WEBSERVER]"]);
  });
