# VoidBot
A Discord Bot.
This is like the fourth or so version of the bot... had to re-write it a few times to keep up with changing APIs and now I'm at it again.

***Note that in order for the play command to work properly, you'll have to install [ffmpeg](https://www.ffmpeg.org/) first***

Before you try to run this you'll have to provide a text file in the main directory called `tokens.json` that contains a login token for discord, an API key for google's youtubeV3 API, a local IP to bind the server to, a key for cookie obfuscation,the password to your mariadb server, and your discord developer app client ID and secret. The file should look like the following:
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
You'll have to set up a mysql server with a database named `voidbot_db` and a user named `voidbot`. There are a few places where you can learn how to do this, so google it.

For obvious reasons, I wont be providing my tokens. Once you have the file in there and your mariaDB server set up, you can run with the following:

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
