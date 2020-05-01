
//Volume command. Alters the bot's audio stream volume to the given value.

const utils = require('../utils.js');
const prefix = utils.config.prefix;
const eSender = require('../main.js').eSender;

module.exports = {
    name: 'volume',
    description: 'Alters the bot\'s volume to the given value.',
    alias: ['vol'],
    args: true,
    usage: `\`${prefix}volume <0-100>\``,
    admin: false,
    botadmin: false,
    server: true,
    execute(params) {
        const regex = /\ud83d\udcaf/
        if (regex.test(params.args[0])) {
            returnVolume(100, params, true);
            return;
        }
        else {
            try { returnVolume(params.args[0], params, false) }
            catch (error) {
                params.msg.reply(`${params.args[0]} is not valid, scrub! Try again!\n Usage: ${this.usage}`);
                let log = global.log;
            log(error);
            }
        };
    }
};

function returnVolume(volume, params, regBool) {
    if (volume > 100 ) { volume = 100 };
    var returnMsg = '';
    if (regBool) { returnMsg = `Set the current volume to :100:` }
    else { returnMsg = `Set the current volume to ${volume}%.` };
    if (params.bot.dispatcher != false) params.bot.dispatcher.setVolume(parseFloat(volume / 100));
    params.msg.channel.send(returnMsg);
    params.bot.defaultVolume = volume;
    eSender.send('updateVol', params.bot);
}