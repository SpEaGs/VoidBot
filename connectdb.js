const db = require("mongoose");
const url = process.env.MONGO_DB_CONNECTION_STRING;

const connect = async () => {
  await db
    .connect(url)
    .then((database) => {
      log("Connected to DB", ["[INFO]", "[DB]"]);
    })
    .catch((err) => {
      log(`Error connecting to DB:\n ${err}`, ["[ERR]", "[DB]"]);
    });
};

db.connect();
