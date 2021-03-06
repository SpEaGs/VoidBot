
const passport = require('passport');
const keys = require('../tokens.json');
const fetch = require('node-fetch');

const { Strategy, Scope } = require('@oauth-everything/passport-discord');

passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser((id, done) => {
    let sql = `SELECT * FROM users WHERE snowflake = ${id}`
    let findUser = db.query(sql, (err, result) => {
        let userIn = result[0];
        let userOut = {
            id: userIn.snowflake,
            name: userIn.username,
            discriminator: userIn.discriminator,
            guilds: {
                admin: userIn.g_admin.split(','),
                member: userIn.g_member.split(',')
            }
        }
        if (userIn.g_admin === "") {
            userOut.guilds.admin = false;
        }
        done(null, userOut);
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
        db.query(`SELECT * FROM guilds`, (err, result) => {
            for (let i of response) {
                //if (result.includes(i.id)) {
                    user.guilds.member.push(i.id);
                    if ((i.permissions & 0x8) == 0x8) {
                        user.guilds.admin.push(i.id);
                    }
                //}
            }
        });
        db.query(`SELECT * FROM users WHERE snowflake = "${user.id}"`, (err, result) => {
            if (err) log(`Error requesting user from DB:\n${err}`, ['[ERR]', '[WEBSERVER]']);
            if (!result.length) {
                log('No user entry found in the DB. Creating a new one...', ['[INFO]', '[WEBSERVER]']);
                let newUser = {
                    username: user.name,
                    discriminator: user.discriminator,
                    snowflake: user.id,
                    g_admin: user.guilds.admin.join(','),
                    g_member: user.guilds.member.join(',')
                }
                let addUserSQL = `INSERT INTO users SET ?`
                let addUserQuery = db.query(addUserSQL, newUser, (err, result2) => {
                    if (err) log(`Error adding new user to DB: ${err}`, ['[ERR]', '[WEBSERVER]']);
                    log(`New user entry successful!`, ['[INFO]', '[WEBSERVER]']);
                })
            }
        })
        done(null, user);
    })
    .catch(err => {
        log(`Error handling discord API request for guilds: ${err}`, ['[ERR]', '[WEBSERVER]']);
    });
}))