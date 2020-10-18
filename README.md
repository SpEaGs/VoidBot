# VoidBot
A Discord Bot.
This is like the fourth or so version of the bot... had to re-write it a few times to keep up with changing APIs and now I'm at it again.

***Note that in order for the play command to work properly, you'll have to install [ffmpeg](https://www.ffmpeg.org/) first***

Before you try to run this you'll have to provide a text file in the main directory called `tokens.json` that contains a login token for discord, an API key for google's youtubeV3 API, a local IP to bind the server to, a key for cookie obfuscation, the password to your mariadb server, and your discord developer app client ID and secret. The file should look like the following:
``` 
{
  "TOKEN": "your discord token here",
  "TOKEN_YT": "your youtubeV3 API key here",
  "HOSTNAME": "your.local.ip.here",
  "COOKIE_KEY": "your cookie key here",
  "DB_PASS": "your DB password here",
  "CLIENT_ID": "your discord app client id here",
  "CLIENT_SECRET": "your discord app client secret here"
}
```
You'll also have to set up a mariaDB mysql server with a database named `voidbot_db` and a user named `voidbot`. There are a few places where you can learn how to do this, so google it. If you wish to use other names, make sure to adjust them in `main.js` starting at line 29.

you can get your token, client id, and client secret from the [discord developer portal](https://discord.com/developers/applications). You'll need to set up a bot application here with the following settings:

Under General Information: Here you can get your client id and client secret, these are the `CLIENT_ID` and `CLIENT_SECRET` mentioned above.

Under Oauth2: add a redirect link using a purchased domain name or your public IP that looks like this: `https://your.domainorpublic.ip/auth/discord/callback`
  note that if you're using your public IP the link will look like this: `https://12.345.67.890:7777/auth/discord/callback`
  the `:7777` is the port number and is vital to the bot working properly so make sure you also forward said port. If you need to change this port, you can find it at line 33 in `main.js`.
  Don't bother with the link generator below, as the bot handles that for you.

Under Bot: click `Add Bot` then click to reveal your token. This is the `TOKEN` mentioned above.

You can name the application and the bot user in the developer portal whatever you'd like, but for sanity's sake just make them `VoidBot`.

As for the youtube token, I won't walk you through that as there are plenty of places to help with that already, but all you need is your access token for the `YouTube Data API v3`.

For obvious reasons, I wont be providing my tokens. Once you have the file in there, your mariaDB server set up, and your discord developer portal squared away, you can run with the following:

`npm install`
then run: `npm start` or debug: `npm run dev`

The config will auto-generate on first run and will have all of the default settings and commands. And no, you don't need to run the bot before packaging. 

If you want the bot as-is, just get your [discord user ID](https://support.discordapp.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-) and put it in the botAdmin list in the config defaults, then `npm start` once again and you're all set.

You can view the config defaults starting at line 7 of `utils.js`, and if you change them after your first run, make sure to first delete `config.json` before running again.

Feel free to write and use your own commands (use existing ones to see the format), just make sure to place them in the commands folder. (and refresh cmds if already running the bot)

**Packaging:** I don't really recommend doing this, since you have to rebuild every time you add commands and I won't be fixing bugs related to this, but the ability is there.

  Windows: `npm run dist-win` then navigate to dist and run the setup exe to install & run (installs to AppData/Local/Progams/voidbot)
  
  Raspbian: `npm run dist-ras` then navigate to dist and execute the app image to run.                           
**Note that for raspbian you may need to install an armv7l version of electron since it sometimes doesn't install properly. To fix this do the following:*
```
npm uninstall electron
npm install -D electron --arch=armv7l
```
**Also note that when building for Raspbian you'll have to run the build process itself on the Raspberry Pi since* `electron-builder`*'s remote linux build is no longer a thing, and cannot (to my knowledge) be worked around. The build takes ~1-3 mins on the Pi 4.*
