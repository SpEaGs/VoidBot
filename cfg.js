const fs = require("fs");
const { log, warn, err } = require("./logger");

const configDefault = {
  pubIP: false,
  welcomeMsgPre: "A new pawn for my schemes!?!?",
  sendoffMsgPre: "Aww... there goes another pawn...",
  botAdmin: ["125759724707774464", "125758417934483456"],
  webAppDomain: "https://speags.com/voidbot/",
  cmdToggles: [],
  sharding: {
    default: {
      guildName: "",
      announcements: false,
      announcementsRole: false,
      newMember: false,
      newMemberRole: false,
      defaultTextChannel: false,
      welcomeTextChannel: false,
      ruleTextChannel: false,
      welcomeMsg: false,
      defaultVoiceChannel: false,
      groupRoles: [],
      audioStats: {
        plays: 0,
        mostPlayedAllTime: "",
        userMostAdded: "",
        mostPlayedSinceLastReport: "",
        playsSinceLastReport: 0,
      },
    },
  },
};

if (!fs.existsSync("./config.json")) {
  try {
    fs.writeFileSync("./config.json", JSON.stringify(configDefault, null, 2));
  } catch (error) {
    err("Error creating fresh config file!", ["[CONFIG]"], error);
  }
}

class Config {
  constructor() {
    Object.assign(this, require("./config.json"));
    this.save = this.save.bind(this);
    this.reload = this.reload.bind(this);
  }
  save(bot = false) {
    if (!!bot) {
      this.sharding[bot.guild.id].guildName = bot.guild.name;
      this.sharding[bot.guild.id].defaultVoiceChannel = bot.defaultVoiceChannel;
      this.sharding[bot.guild.id].announcements = bot.announcements;
      this.sharding[bot.guild.id].announcementsRole = bot.announcementsRole;
      this.sharding[bot.guild.id].newMember = bot.newMember;
      this.sharding[bot.guild.id].newMemberRole = bot.newMemberRole;
      this.sharding[bot.guild.id].defaultTextChannel = bot.defaultTextChannel;
      this.sharding[bot.guild.id].welcomeTextChannel = bot.welcomeTextChannel;
      this.sharding[bot.guild.id].welcomeMsg = bot.welcomeMsg;
      this.sharding[bot.guild.id].ruleTextChannel = bot.ruleTextChannel;
      this.sharding[bot.guild.id].audioStats = bot.audioStats;
    }
    fs.writeFile(
      "./config.json",
      JSON.stringify(
        {
          pubIP: this.pubIP,
          welcomeMsgPre: this.welcomeMsgPre,
          sendoffMsgPre: this.sendoffMsgPre,
          botAdmin: this.botAdmin,
          webAppDomain: this.webAppDomain,
          cmdToggles: this.cmdToggles,
          sharding: this.sharding,
        },
        null,
        2
      ),
      (error) => {
        if (error) err(`Error saving config!`, ["[CONFIG]"], error);
      }
    );
  }
  reload() {
    Object.assign(this, require("./config.json"));
  }
}

module.exports = new Config();
