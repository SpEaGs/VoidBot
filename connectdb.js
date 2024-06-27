const db = require("mongoose");
const url = process.env.MONGO_DB_CONNECTION_STRING;

const connect = () => {
  db.connect(url)
    .then((database) => {
      log("Connected to DB", ["[INFO]", "[DB]"]);
      return db.connection;
    })
    .catch((err) => {
      log(`Error connecting to DB:\n ${err}`, ["[ERR]", "[DB]"]);
    });
};

module.exports = {
  db: connect(),
};
