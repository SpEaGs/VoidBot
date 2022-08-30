# VoidBot

A Discord Bot.
This is like the fourth or so version of the bot... had to re-write it a few times to keep up with changing APIs and now I'm at it again.

**_Note that in order for the play command to work properly, you'll have to install [ffmpeg](https://www.ffmpeg.org/) first_**

Before you try to run this you'll have to provide a text file in the main directory called `tokens.json` that contains access tokens for discord, youtubeV3 API, and Soundcloud API, a local IP to bind the server to, a key for cookie obfuscation, the password to your mongodb server, and your discord developer app client ID and secret. The file should look like the following:

```
{
  "TOKEN": "your discord token here",
  "TOKEN_YT": "your youtubeV3 API key here",
  "TOKEN_SC": "your soundcloud API key here",
  "HOSTNAME": "your.local.ip.here",
  "DB_PASS": "your DB password here",
  "CLIENT_ID": "your discord app client id here",
  "CLIENT_SECRET": "your discord app client secret here"
}
```

You'll also have to set up a mongodb server. There are a few places where you can learn how to do this, so google it.

you can get your token, client id, and client secret from the [discord developer portal](https://discord.com/developers/applications). You'll need to set up a bot application here with the following settings:

Under General Information: Here you can get your client id and client secret, these are the `CLIENT_ID` and `CLIENT_SECRET` mentioned above.

Under Oauth2: add a redirect link using a purchased domain name or your public IP that looks like this: `https://your.domainorpublic.ip/auth/discord/callback`
note that if you're using your public IP the link will look like this: `https://12.345.67.890:7777/auth/discord/callback`
the `:7777` is the port number and is vital to the bot working properly so make sure you also forward said port. If you need to change this port, you can find it at line 33 in `main.js`.
Don't bother with the link generator below, as the bot handles that for you.

Under Bot: click `Add Bot` then click to reveal your token. This is the `TOKEN` mentioned above.
You'll also need to enable the Presence and Server Members intents found here.

You can name the application and the bot user in the developer portal whatever you'd like, but for sanity's sake just make them `VoidBot`.

As for the youtube token, I won't walk you through that as there are plenty of places to help with that already, but all you need is your access token for the `YouTube Data API v3`.
Same for the Soundcloud Token. Currently they're not accepting applications to get tokens but there are ways, so use some google-fu.

For obvious reasons, I wont be providing my tokens. Once you have the file in there, your mongodb server set up, and your discord developer portal squared away, you can run with the following:

`npm i`
then: `npm start`

The config will auto-generate on first run and will have all of the default settings and commands.

If you want the bot as-is, just get your [discord user ID](https://support.discordapp.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-) and put it in the botAdmin list in the config defaults, then `npm start` once again and you're all set.

You can view the config defaults starting at line 7 of `utils.js`, and if you change them after your first run, make sure to first delete `config.json` before running again.

Feel free to write and use your own commands (use existing ones to see the format), just make sure to place them in the commands folder. (and refresh cmds if already running the bot)

When adding the bot to a server, don't worry about permissions as whatever roles it gets in a server will determine what it can see and do, but if you want it to work as intended then the only permission it needs is admin. Just don't forget to check your server's role heirarchy and put the bot's role above any roles you want it to be able to manage.
