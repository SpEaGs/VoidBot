
const passport = require('passport');
const status = require('../main.js');
const keys = require('../tokens.json');
//const fetch = require('node-fetch');

const { Strategy, Scope, snowflakeToDate } = require('@oauth-everything/passport-discord');

passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser((id, done) => {
    let sql = `SELECT * FROM users WHERE snowflake = ${id}`
    let findUser = db.query(sql, (err, result) => {
        done(err, result[0]);
    });
});

passport.use( new Strategy({
    clientID: keys.CLIENT_ID,
    clientSecret: keys.CLIENT_SECRET,
    callbackURL: `/auth/discord/callback`,
    scope: [Scope.IDENTIFY, Scope.GUILDS]
}, (accessToken, refreshToken, profile, done) => {
    let user = {
        id: profile.id,
        name: profile.username,
        discriminator: profile.displayName.split('#').pop()
    }
    let findUserSQL = `SELECT * FROM users WHERE snowflake = "${user.id}"`
    let findUserQuery = db.query(findUserSQL, (err, result) => {
        if (err) logErr(`[MAIN] Error requesting user from DB: ${err}`);
        if (!result.length) {
            log('No user entry found in the DB. Creating a new one...');
            let newUser = {
                username: user.name,
                snowflake: user.id
            }
            let addUserSQL = `INSERT INTO users SET ?`
            let addUserQuery = db.query(addUserSQL, newUser, (err, result2) => {
                if (err) log(`[MAIN] Error adding new user to DB: ${err}`);
                log(`New user entry successful!`);
            })
        }
    })
    fetch('https://discordapp.com/api/users/@me/guilds', {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    })
    .then(res => res.json())
    .then(response => {
        user.guilds = {
            admin: [],
            member: []
        }
        for(let bot of status.client.children.array()) {
            if(bot.visAdminRoles.includes(user.snowflake)) {
                user.guilds.admin.push(bot.guildID)
            }
            for (let i of response) {
                if (Object.keys(status.client.children.array()).includes(i.id)) {
                    user.guilds.member.push(i.id);
                }
            }
        }
        for(let botGuild of Object.keys(guilds)) {
            for (let i of response) {
                if (Object.values(i).includes(botGuild)) {
                    if(Object.values(guilds[botGuild]).includes(user.id)) {
                        user.guilds.admin.push(botGuild);
                    }
                    else {
                        user.guilds.member.push(botGuild);
                    }
                }
            }
        }
    })
    .catch(err => {
        logErr(`[MAIN] Error handling discord API request for guilds: ${err}`);
    });
    log(JSON.stringify(user));
    done(null, user);
}))