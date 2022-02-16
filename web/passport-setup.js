const passport = require("passport");
const keys = require("../tokens.json");
const fetch = require("node-fetch");

const { Strategy, Scope } = require("@oauth-everything/passport-discord");

const User = require("./models/user");

passport.serializeUser((user, done) => {
  done(null, user.token);
});
passport.deserializeUser((token, done) => {
  User.findOne({ token: token }, (err, user) => {
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
      callbackURL: `/auth/discord/callback`,
      scope: [Scope.IDENTIFY, Scope.GUILDS],
    },
    (accessToken, refreshToken, profile, done) => {
      let user = {
        snowflake: profile.id,
        username: profile.username,
        discriminator: profile.displayName.split("#").pop(),
        token: accessToken,
      };
      fetch("https://discordapp.com/api/users/@me/guilds", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
        .then((res) => res.json())
        .then((response) => {
          user.guilds = {
            admin: [],
            member: [],
          };
          for (let i of response) {
            user.guilds.member.push(i.id);
            if ((i.permissions & 0x8) == 0x8) {
              user.guilds.admin.push(i.id);
            }
          }
          User.findOne({ snowflake: user.snowflake }, (err, dbUser) => {
            if (err)
              log(`Error requesting user from DB:\n${err}`, [
                "[ERR]",
                "[WEBSERVER]",
              ]);
            if (!dbUser) {
              log("No user entry found in the DB. Creating a new one...", [
                "[INFO]",
                "[WEBSERVER]",
              ]);
              let newDBUser = new User({
                snowflake: user.snowflake,
                username: user.username,
                discriminator: user.discriminator,
                guilds: user.guilds,
                token: accessToken,
              });
              log(JSON.stringify(newDBUser), ["[WARN]", "[WEBSERVER]"]);
              newDBUser.save((err) => {
                if (err)
                  log(`Error adding new user to DB:\n${err}`, [
                    "[ERR]",
                    "[WEBSERVER]",
                  ]);
              });
            } else {
              log("User found in DB.", ["[INFO]", "[WEBSERVER]"]);
              dbUser.token = accessToken;
              dbUser.save((err) => {
                if (err)
                  log(`Error updating user with new token:\n${err}`, [
                    "[ERR]",
                    "[WEBSERVER]",
                  ]);
              });
            }
          });
          done(null, user);
        })
        .catch((err) => {
          log(`Error handling discord API request for guilds:\n${err}`, [
            "[ERR]",
            "[WEBSERVER]",
          ]);
        });
    }
  )
);
