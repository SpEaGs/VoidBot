const winston = require("winston");
const utils = require("./utils");
var sockets = require("./main.js").consoleSockets;

let backlog = [];
class Logger {
  constructor() {
    this.pipeline = winston.createLogger({
      level: "info",
      format: winston.format.combine(
        winston.format.json(),
        winston.format.colorize({
          all: true,
          colors: { info: "white", warning: "yellow", error: "red" },
        })
      ),
      transports: [
        new winston.transports.File({ filename: "error.log", level: "error" }),
        new winston.transports.File({ filename: "combined.log" }),
        new winston.transports.Console({ format: winston.format.simple() }),
      ],
    });
    this.log = this.log.bind(this);
  }
  log(str, tags) {
    let lo = { timeStamp: utils.getTime(), tags: tags, msg: str };
    let ls = `${lo.timeStamp} ${lo.tags.join(" ")}: ${lo.msg}`;
    switch (true) {
      case tags.includes("[INFO]"): {
        this.pipeline.info(ls);
        break;
      }
      case tags.includes("[WARN]"): {
        this.pipeline.warn(ls);
        break;
      }
      case tags.includes("[ERR]"): {
        this.pipeline.error(ls);
        break;
      }
    }
    if (!sockets) {
      sockets = require("./main.js").consoleSockets;
    }
    if (!!sockets)
      sockets.forEach((s) => {
        s.once("stdout_auth", (snowflake) => {
          console.log(utils.config.botAdmin);
          console.log(snowflake);
          if (utils.config.botAdmin.includes(snowflake)) {
            console.log(true);
            s.emit("stdout", lo);
          }
        });
        s.emit("stdout_check");
      });
    backlog.push(lo);
  }
  getBacklog() {
    return backlog;
  }
}

module.exports = Logger;