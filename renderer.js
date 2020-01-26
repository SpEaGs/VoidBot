
const remote = require('electron').remote;
const ipcRenderer = require('electron').ipcRenderer;
const utils = require('./utils.js');

let test = "this is a test"

function getTest() {return test;};

function min() {
    remote.getCurrentWindow().minimize();
}
function max() {
    switch (remote.getCurrentWindow().isMaximized()) {
        case true: { remote.getCurrentWindow().unmaximize(); break; }
        case false: { remote.getCurrentWindow().maximize(); break; }
    }
}
function cl() {
    remote.getCurrentWindow().close();
}

function appendText(elementID, str) {
    document.getElementById(elementID).innerHTML += (' > '+str+'<br>');
}

function createElement(tag='div', classes=[], id='') {
    toReturn = document.createElement(tag)
    if (classes !== []) { for (i of classes) { toReturn.classList.add(i); } }
    if (id !== '') { toReturn.id = id; }
    return toReturn;
}

function createSettingItem(guildID='', settingName='placeholder setting name', type='dropdown', subtype='voiceChannel', value) {
    let tag = ''
    switch (subtype) {
        case 'voiceChannel': { tag = 'VC'; break; }
        case 'textChannel': { tag = 'TX'; break; }
        case 'rtextChannel': { tag = 'RT'; break; }
        case 'role': { tag = 'RO'; break; }
        case 'arole': { tag= 'AR'; break; }
        case 'vol': { tag = 'DV'; break; }
    }
    let toReturn = createElement('div', ['mainContentSettingItem'], `mainContentSettingItem${tag}${guildID}`);
        let maintxt = createElement('div', ['mainContentSettingItemText']);
            maintxt.innerHTML = settingName;
            toReturn.appendChild(maintxt);
        switch (type) {
            case 'dropdown': {
                let dropdown = createElement('div', ['dropdown'], `${subtype}Dropdown${guildID}`);
                    let dropdownButton = createElement('button', ['dropdownButton'], `${subtype}DropdownButton${guildID}`);
                        dropdownButton.onclick = () => { showDropdown((`dropdownContent${tag}${guildID}`)); }
                        dropdownButton.innerHTML = `Select one here`;
                        dropdown.appendChild(dropdownButton);
                    dropdownContent = createElement('div', ['dropdownContent', 'hidden'], `dropdownContent${tag}${guildID}`);
                        dropdown.appendChild(dropdownContent);
                    toReturn.appendChild(dropdown);
                break;
            }
            case 'slider': {
                let slider = createElement('div', ['rangeSliderContainer'], `rangeSliderContainer${tag}${guildID}`);
                    let sliderInput = createElement('input', ['slider'], `slider${tag}${guildID}`);
                        sliderInput.type = 'range';
                        sliderInput.min = '0';
                        sliderInput.max = '100';
                        sliderInput.value = value;
                        slider.appendChild(sliderInput);
                    let sliderText = createElement('div', ['mainContentSettingItemSubText'], `mainContentSettingItemSubText${tag}${guildID}`);
                        sliderText.innerHTML = value;
                        slider.appendChild(sliderText);
                    toReturn.appendChild(slider);
                break;
            }
        }
    return toReturn;
}

function selectTab(str) {
    for (let i of document.getElementsByClassName('navbarButton')) {
        if (i.id == ('navbarButton'+str)) { i.classList.add('navbarButtonSelected'); }
        else { i.classList.remove('navbarButtonSelected'); }
    }
    for (let i of document.getElementsByClassName('navbarMenuContainer')) {
        if (i.id == ('navbarMenu'+str)) { i.classList.remove('hidden'); }
        else { i.classList.add('hidden'); }
    }
    for (let i of document.getElementsByClassName('mainContentContainer')) {
        if (i.id == ('mainContent'+str)) { i.classList.remove('hidden'); }
        else { i.classList.add('hidden'); }
    }
}

function selectSubTab(str) {
    for (let i of document.getElementsByClassName('navbarMenuButton')) {
        if (i.id == ('navbarMenuButton'+str)) { i.classList.add('navbarMenuButtonSelected'); }
        else { i.classList.remove('navbarMenuButtonSelected'); }
    }
    for (let i of document.getElementsByClassName('mainContentSubContainer')) {
        if (i.id == ('mainContentSub'+str)) { i.classList.remove('hidden'); }
        else { i.classList.add('hidden'); }
    }
}

function showDropdown(elID) {
    document.getElementById(elID).classList.toggle('hidden');
}

function dropdownSelectItem(elID, iName, iID, guildID, iType, channel) {
    document.getElementById(elID).innerHTML = iName;
    switch (iType) {
        case 'voiceChannel': {
            utils.config.sharding[guildID].localMusicVC = { id: iID, name: iName };
            break;
        }
        case 'textChannel': {
            switch (channel) {
                case 'default': {
                    utils.config.sharding[guildID].defaultTextChannel = { id: iID, name: iName };
                    break;
                }
                case 'rules': {
                    utils.config.sharding[guildID].ruleTextChannel = { id: iID, name: iName };
                    break;
                }
            }
            break;
        }
        case 'role': {
            switch (channel) {
                case 'newUser': {
                    utils.config.sharding[guildID].newUserRole = { id: iID, name: iName };
                    break;
                }
                case 'announcement': {
                    utils.config.sharding[guildID].announcementsRole = { id: iID, name: iName };
                    break;
                }
            }
            break;
        }
    }
    utils.dumpJSON('./config.json', utils.config, 2);
}

function executeCmd(str, args = []) {
    if (typeof args !=="string") {
        arg = args.splice(0, 0, str);
    }
    else {
        arg = [str, args];
    }
    ipcRenderer.send('command', arg);
}

ipcRenderer.on('stdout', (event, arg) => {
    appendText('mainContentItemSTDOUT', arg);
    document.getElementById('mainContentItemSTDOUT').scrollTop = document.getElementById('mainContentItemSTDOUT').scrollHeight;
});

ipcRenderer.on('add-client', (event, bot) => {
    shardBtn = createElement('div', ['navbarMenuButton'], `navbarMenuButtonShard${bot.guildID}`);
        shardBtn.onclick = () => { selectSubTab(`Shard${bot.guildID}`); }
        shardBtnTxt = createElement('div', ['navbarMenuButtonText']);
            shardBtnTxt.innerHTML = `${bot.guildName}`;
            shardBtn.appendChild(shardBtnTxt);
        document.getElementById('navbarMenuSharding').appendChild(shardBtn);

    shardContent = createElement('div', ['mainContentSubContainer', 'flex', 'hidden'], `mainContentSubShard${bot.guildID}`);
        shardContent.appendChild(createSettingItem(bot.guildID, 'Default Voice Channel', 'dropdown', 'voiceChannel'));
        shardContent.appendChild(createSettingItem(bot.guildID, 'Music Volume', 'slider', 'vol', bot.defaultVolume));
        shardContent.appendChild(createSettingItem(bot.guildID, 'Announcements Role', 'dropdown', 'arole'));
        shardContent.appendChild(createSettingItem(bot.guildID, 'New Member Role', 'dropdown', 'role'));
        shardContent.appendChild(createSettingItem(bot.guildID, 'Default Text Channel', 'dropdown', 'textChannel'));
        shardContent.appendChild(createSettingItem(bot.guildID, 'Rules Text Channel', 'dropdown', 'rtextChannel'));
        
        document.getElementById('mainContentSharding').appendChild(shardContent);
    
    document.getElementById(`sliderDV${bot.guildID}`).oninput = () => {
        let val = document.getElementById(`sliderDV${bot.guildID}`).value;
        document.getElementById(`mainContentSettingItemSubTextDV${bot.guildID}`).innerHTML = val;
        if (!bot.dispatcher == false) { bot.dispatcher.setVolume(parseFloat(val)/100); }
        utils.config.sharding[bot.guildID].defaultVolume = val;
        utils.dumpJSON('./config.json', utils.config, 2);
    }
    for (let i of bot.voiceChannelArray) {
        let dropdownItem = createElement('a');
            dropdownItem.href = `#${i.id}`;
            dropdownItem.onclick = () => { dropdownSelectItem(`voiceChannelDropdownButton${bot.guildID}`, i.cName, i.id, bot.guildID, 'voiceChannel', ''); }
            dropdownItem.innerHTML = i.name;
        document.getElementById(`dropdownContentVC${bot.guildID}`).appendChild(dropdownItem);
        if (i.id == utils.config.sharding[bot.guildID].localMusicVC.id) { document.getElementById(`voiceChannelDropdownButton${bot.guildID}`).textContent = i.cName; }
    }
    for (let i of bot.textChannelArray) {
        let dropdown1Item = createElement('a');
            dropdown1Item.href = `#${i.id}`;
            dropdown1Item.innerHTML = i.name;
            dropdown1Item.onclick = () => { dropdownSelectItem(`textChannelDropdownButton${bot.guildID}`, i.cName, i.id, bot.guildID, 'textChannel', 'default'); }
        document.getElementById(`dropdownContentTX${bot.guildID}`).appendChild(dropdown1Item);
        let dropdown2Item = createElement('a');
            dropdown2Item.href = `#${i.id}`;
            dropdown2Item.innerHTML = i.name;
            dropdown2Item.onclick = () => { dropdownSelectItem(`rtextChannelDropdownButton${bot.guildID}`, i.cName, i.id, bot.guildID, 'textChannel', 'rules'); }
        document.getElementById(`dropdownContentRT${bot.guildID}`).appendChild(dropdown2Item);
        if (i.id == utils.config.sharding[bot.guildID].defaultTextChannel.id) { document.getElementById(`textChannelDropdownButton${bot.guildID}`).textContent = i.cName; }
        if (i.id == utils.config.sharding[bot.guildID].ruleTextChannel.id) { document.getElementById(`rtextChannelDropdownButton${bot.guildID}`).textContent = i.cName; }
    }
    for (let i of bot.roleArray) {
        let dropdown1Item = createElement('a');
            dropdown1Item.href = `#${i.id}`;
            dropdown1Item.innerHTML = i.name;
            dropdown1Item.onclick = () => { dropdownSelectItem(`aroleDropdownButton${bot.guildID}`, i.cName, i.id, bot.guildID, 'role', 'announcement'); }
        document.getElementById(`dropdownContentAR${bot.guildID}`).appendChild(dropdown1Item);
        let dropdown2Item = createElement('a');
            dropdown2Item.href = `#${i.id}`;
            dropdown2Item.innerHTML = i.name;
            dropdown2Item.onclick = () => { dropdownSelectItem(`roleDropdownButton${bot.guildID}`, i.cName, i.id, bot.guildID, 'role', 'newUser'); }
        document.getElementById(`dropdownContentRO${bot.guildID}`).appendChild(dropdown2Item);
            if (i.id == utils.config.sharding[bot.guildID].announcementsRole.id) { document.getElementById(`aroleDropdownButton${bot.guildID}`).textContent = i.cName; }
            if (i.id == utils.config.sharding[bot.guildID].newUserRole.id) { document.getElementById(`roleDropdownButton${bot.guildID}`).textContent = i.cName; }
    }
});

window.onclick = (e) => {
    if (!e.target.matches('.dropdownButton')) {
        let dropdowns = document.getElementsByClassName('dropdownContent');
        for (let i = 0; i < dropdowns.length; i++) {
            if (!dropdowns[i].classList.contains('hidden')) {
                dropdowns[i].classList.add('hidden');
            }
        }
    }
}

ipcRenderer.send('init-eSender', 'main');