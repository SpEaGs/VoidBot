const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const passport = require("passport");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
require("./utils/connectdb");

require("./strategies/jwt");
require("./strategies/local");
require("./auth");

const userRouter = require("./routers/user");

const api = express();

api.use(bodyParser.json());
api.use(cookieParser(process.env.COOKIE_SECRET));

const whitelist = proces.env.WHITELISTED_DOMAINS
  ? process.env.WHITELISTED_DOMAINS.split(",")
  : [];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

api.use(cors(corsOptions));

api.use(passport.initialize());

api.use("/users", userRouter);

api.get("/", (req, res) => {
  res.send({ status: success });
});

const server = api.listen(process.env.PORT || 8081, () => {
  const port = server.address().port;
  console.log("API started at oprt:", port);
});
