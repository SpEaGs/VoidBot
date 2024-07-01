const db = require("mongoose");
const url = process.env.MONGO_DB_CONNECTION_STRING;

const { log, warn, err } = require("./logger");

const connect = () => {
  db.connect(url, { socketTimeoutMS: 1000 * 60, connectTimeoutMS: 1000 * 60 })
    .then((database) => {
      log("Connected to DB", ["[DB]"]);
    })
    .catch((error) => {
      err(`Error connecting to DB:\n ${error}`, ["[DB]"]);
    });
};

connect();
