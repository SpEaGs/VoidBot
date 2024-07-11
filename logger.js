const winston = require("winston");
const sockets = require("./main.js").consoleSockets;
let botAdmin = require("./config.json").botAdmin;

class Logger {
  constructor() {
    this.backlog = [];
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
    this.getTime = this.getTime.bind(this);
    this.handleLog = this.handleLog.bind(this);
    this.log = this.log.bind(this);
    this.warn = this.warn.bind(this);
    this.err = this.err.bind(this);
    this.getBacklog = this.getBacklog.bind(this);
  }
  getTime() {
    let cTime = new Date(Date.now());
    let timeStr = `[${this.zeroify(cTime.getMonth() + 1)}/${this.zeroify(
      cTime.getDate()
    )} ${this.zeroify(cTime.getHours())}:${this.zeroify(
      cTime.getMinutes()
    )}:${this.zeroify(cTime.getSeconds())}]`;
    return timeStr;
  }
  getTimeRaw() {
    return new Date().getTime();
  }
  zeroify(num) {
    if (num < 10) {
      return `0${num}`;
    } else return `${num}`;
  }
  sendSocketLog(lo) {
    sockets.forEach((s) => {
      s.once("stdout_auth", (snowflake) => {
        if (botAdmin.includes(snowflake)) {
          s.emit("stdout", lo);
        }
      });
      s.emit("stdout_check");
    });
  }
  handleLog(lo) {
    const ls = `${lo.timeStamp} [${lo.level}] ${lo.tags.join(" ")}: ${lo.msg}${
      lo.error ? `\n${lo.error}` : ``
    }`;
    this.pipeline[lo.level.toLowerCase()](ls);
    if (!!sockets) this.sendSocketLog(lo);
    this.backlog.push(lo);
  }
  log(str, tags) {
    this.handleLog({
      timeStamp: this.getTime(),
      tags,
      msg: str,
      level: "INFO",
    });
  }
  warn(str, tags, error = false) {
    this.handleLog({
      timeStamp: this.getTime(),
      tags,
      msg: str,
      level: "WARN",
      error,
    });
  }
  err(str, tags, error = false) {
    this.handleLog({
      timeStamp: this.getTime(),
      tags,
      msg: str,
      level: "ERROR",
      error,
    });
  }
  getBacklog(count = 0) {
    if (count === 0) return this.backlog;
    else return this.backlog.slice(this.backlog.length - (count + 1), count);
  }
  reloadBotAdmin() {
    botAdmin = require("./config.json").botAdmin;
  }
}

module.exports = new Logger();
