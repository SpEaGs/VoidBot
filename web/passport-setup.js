
const passport = require('passport');
const keys = require('../tokens.json');
const fetch = require('node-fetch');

const { Strategy, Scope, snowflakeToDate } = require('@oauth-everything/passport-discord');

passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser((id, done) => {
    /*let sql = `SELECT * FROM users WHERE id = ${id}`
    let findUser = db.query(sql, (err, result) => {
        done(err, result[0]);
    });*/
    done(null, id)
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
        discriminator: profile.displayName.split('#').pop(),
        guilds: {
            admin: [],
            member: []
        }
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
    done(null, user);
}))