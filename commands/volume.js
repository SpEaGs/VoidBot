
//Volume command. Alters the bot's audio stream volume to the given value.

const utils = require('../utils.js');
const prefix = utils.config.prefix;
const updateVol = require('../main.js').updateVol;

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
                params.bot.guild.channels.cache.get(params.bot.defaultTextChannel.id).send(`${params.args[0]} is not valid, scrub! Try again!\n Usage: ${this.usage}`);
                let log = global.log;
            log(`Error updating volume:\n${error}`, ['[ERR]', '[VOLUME]']);
            }
        };
    },
    regJSON: {
        name: this.name,
        description: this.description,
        options: [
            {
                name: 'value',
                description: 'Value to set volume to.',
                type: 4,
                required: true
            }
        ]
    }
};

function returnVolume(volume='', params, regBool) {
    let returnMsg = '';
    switch (volume[0]) {
        case '+': {
            let volMod = volume.replace('+', '');
            let newVol = (params.bot.defaultVolume+parseInt(volMod));
            if (newVol > 100) { newVol = 100 };
            params.bot.defaultVolume = parseInt(newVol);
            break;
        }
        case '-': {
            let volMod = volume.replace('-', '');
            let newVol = (params.bot.defaultVolume-parseInt(volMod));
            if (newVol < 0) { newVol = 0 };
            params.bot.defaultVolume = parseInt(newVol);
            break;
        }
    }
    if (volume[0] != '+' && volume[0] != '-') {
        if (volume > 100) { volume = 100 };
        params.bot.defaultVolume = parseInt(volume);
    }
    if (regBool) { returnMsg = `Set the current volume to :100:` }
    else { returnMsg = `Set the current volume to ${params.bot.defaultVolume}%.` };
    if (params.bot.dispatcher != false) params.bot.dispatcher.setVolume(parseFloat(params.bot.defaultVolume / 100));
    params.bot.guild.channels.cache.get(params.bot.defaultTextChannel.id).send(returnMsg);
    utils.saveConfig(params.bot);
    updateVol(params.bot);
}