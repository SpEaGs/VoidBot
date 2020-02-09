# VoidBot
A Discord Bot.
This is like the fourth or so version of the bot... had to re-write it a few times to keep up with changing APIs and now I'm at it again.

`npm install`
then run: `npm start` or debug: `npm run dev`

**Packaging:**

  Windows: `npm run dist-win` then navigate to dist and run the setup exe to install & run (installs to AppData/Local/Progams/voidbot)
  
  Raspbian: `npm run dist-ras` then navigate to dist and execute the app image to run.                           
**Note that for raspbian you may need to install an armv7l version of electron since it sometimes doesn't install properly. To fix this do the following:*
```
npm uninstall electron
npm install -D electron --arch=armv7l
```
