const db = require("mongoose");
const url = process.env.MONGO_DB_CONNECTION_STRING;

const connect = () => {
  db.connect(url, { socketTimeoutMS: 1000 * 60, connectTimeoutMS: 1000 * 60 })
    .then((database) => {
      log("Connected to DB", ["[INFO]", "[DB]"]);
    })
    .catch((err) => {
      log(`Error connecting to DB:\n ${err}`, ["[ERR]", "[DB]"]);
    });
};

connect();
