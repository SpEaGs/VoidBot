const passport = require("passport");
const keys = require("../tokens.json");
const fetch = require("node-fetch");
const utils = require("../utils.js");

const { Strategy, Scope } = require("@oauth-everything/passport-discord");

const User = require("./models/user");

passport.serializeUser((user, done) => {
  done(null, user.token);
});
passport.deserializeUser((id, done) => {
  User.findOne({ token: id }, (err, user) => {
    if (err) return done(err, false);
    if (user) return done(null, user);
    else return done(null, false);
  });
});

passport.use(
  new Strategy(
    {
      clientID: keys.CLIENT_ID,
      clientSecret: keys.CLIENT_SECRET,
      callbackURL: `https://speags.com/apis/voidbot/auth/discord/callback`,
      scope: [Scope.IDENTIFY, Scope.GUILDS],
    },
    (accessToken, refreshToken, profile, done) => {
      fetch("https://discordapp.com/api/users/@me/guilds", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
        .then((res) => res.json())
        .then((response) => {
          let userGuilds = {
            admin: [],
            member: [],
          };
          for (let i of response) {
            userGuilds.member.push(i.id);
            if ((i.permissions & 0x8) == 0x8) {
              userGuilds.admin.push(i.id);
            }
          }
          User.findOne({ snowflake: profile.id }, (err, dbUser) => {
            if (err) {
              log(`Error requesting user from DB:\n${err}`, [
                "[ERR]",
                "[WEBSERVER]",
              ]);
              done(err, false);
            }
            if (!dbUser) {
              log("No user entry found in the DB. Creating a new one...", [
                "[INFO]",
                "[WEBSERVER]",
              ]);
              let newDBUser = new User({
                snowflake: profile.id,
                username: profile.username,
                discriminator: profile.displayname.split("#").pop(),
                guilds: userGuilds,
                token: accessToken,
                botAdmin: !!utils.config.botAdmin.includes(profile.id),
              });
              newDBUser.save((err) => {
                if (err) {
                  log(`Error adding new user to DB:\n${err}`, [
                    "[ERR]",
                    "[WEBSERVER]",
                  ]);
                  done(err, false);
                }
              });
              done(null, newDBUser);
            } else {
              log("User found in DB.", ["[INFO]", "[WEBSERVER]"]);
              dbUser.guilds = userGuilds;
              dbUser.token = accessToken;
              dbUser.botAdmin = !!utils.config.botAdmin.includes(
                dbUser.snowflake
              );
              dbUser.save((err) => {
                if (err)
                  log(`Error updating user with new data:\n${err}`, [
                    "[ERR]",
                    "[WEBSERVER]",
                  ]);
              });
              done(null, dbUser);
            }
          });
        })
        .catch((err) => {
          log(`Error handling discord API request for guilds:\n${err}`, [
            "[ERR]",
            "[WEBSERVER]",
          ]);
          done(err, false);
        });
    }
  )
);
