let eleBool = false
let remote;
let ipcRenderer;
let populated = false;

try {
    remote = require('electron').remote;
    ipcRenderer = require('electron').ipcRenderer;
    eleBool = true;
}
catch {
    ipcRenderer = io(`http://${window.location.hostname}:7777`);
    ipcRenderer.once('connect', () => {
        ipcRenderer.emit('initConnect');
    });
    ipcRenderer.on('connect_error', (err) => {
        console.log('Connection Error: (Will attempt to reconnect)');
        console.log(err);
        document.getElementById('errPopup').classList.remove('hidden');
    });
    ipcRenderer.on('reconnect', (n) => {
        console.log(`Reconnected after ${n} attempts.`);
        document.getElementById('errPopup').classList.add('hidden');
    });
}

//--------------------------------------------------------------------------------------------------------------
//This file handles the rendering of the HTML.
//Note that when changing the pugs you must compile index.pug to index.html as the pugs are not rendered for the
//client. I recommend using a vscode plugin called "Pug to HTML" 
//(hotkey is "ctrl + k, p" then copy/paste the preview)
//--------------------------------------------------------------------------------------------------------------

//window controls (minimize, maximize, and close)
function min() {
    if(remote) {
        remote.getCurrentWindow().minimize();
    }
}
function max() {
    if(remote) {
        switch (remote.getCurrentWindow().isMaximized()) {
            case true: { remote.getCurrentWindow().unmaximize(); break; }
            case false: { remote.getCurrentWindow().maximize(); break; }
        }
    }
}
function cl() {
    executeCmd('kill', '');
}

//appends a new line of text to a given element
function appendText(elementID, str) {
    document.getElementById(elementID).innerHTML += (' > '+str+'<br>');
}

//creates a new element with given tag, classes, and id
function createElement(tag='div', classes=[], id='') {
    toReturn = document.createElement(tag)
    if (classes !== []) { for (i of classes) { toReturn.classList.add(i); } }
    if (id !== '') { toReturn.id = id; }
    return toReturn;
}

//template for creating a new item in the list of settings for each guild
function createSettingItem(guildID='', settingName='placeholder setting name', type='dropdown', subtype='voiceChannel', value) {
    let tag = ''
    switch (subtype) {
        case 'voiceChannel': { tag = 'VC'; break; }
        case 'textChannel': { tag = 'TX'; break; }
        case 'wtextChannel': { tag = 'WT'; break; }
        case 'rtextChannel': { tag = 'RT'; break; }
        case 'role': { tag = 'RO'; break; }
        case 'arole': { tag= 'AR'; break; }
        case 'vol': { tag = 'DV'; break; }
        case 'welcome': {tag = 'WE'; break; }
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
            case 'toggle': {
                let toggle = createElement('label', ['toggleSwitchContainer'], `toggleSwitchContainer${tag}${guildID}`);
                    let toggleInput = createElement('input', ['toggle'], `toggle${tag}${guildID}`);
                        toggleInput.type = 'checkbox';
                        toggleInput.checked = false;
                        toggle.appendChild(toggleInput);
                    let toggleSpan = createElement('span', ['toggleSlider'], `toggleSlider${tag}${guildID}`);
                        toggle.appendChild(toggleSpan);
                    toReturn.appendChild(toggle);
                break;
            }
        }
    return toReturn;
}

//selects a navbar tab
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

//selects a navbar menu tab (navbar tabs can contain any number of menu tabs... this is basically just for sharding menus atm)
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

//toggles visibility of a given element (used literally only for the dropdown menus in shard settings)
function showDropdown(elID) {
    document.getElementById(elID).classList.toggle('hidden');
}

//selects and sets an item clicked on in a dropdown menu
function dropdownSelectItem(elID, iName, iID, bot, iType, channel) {
    document.getElementById(elID).innerHTML = iName;
    switch (iType) {
        case 'voiceChannel': {
            bot.defaultVoiceChannel = { id: iID, name: iName };
            switch (eleBool) {
                case true: { ipcRenderer.send('updateBot', bot); break;}
                case false: { ipcRenderer.emit('updateBot', bot); break;}
            }
            break;
        }
        case 'textChannel': {
            switch (channel) {
                case 'default': {
                    bot.defaultTextChannel = { id: iID, name: iName };
                    switch (eleBool) {
                        case true: { ipcRenderer.send('updateBot', bot); break;}
                        case false: { ipcRenderer.emit('updateBot', bot); break;}
                    }
                    break;
                }
                case 'rules': {
                    bot.ruleTextChannel = { id: iID, name: iName };
                    switch (eleBool) {
                        case true: { ipcRenderer.send('updateBot', bot); break;}
                        case false: { ipcRenderer.emit('updateBot', bot); break;}
                    }
                    break;
                }
                case 'welcome': {
                    bot.welcomeTextChannel = { id: iID, name: iName };
                    switch (eleBool) {
                        case true: { ipcRenderer.send('updateBot', bot); break;}
                        case false: { ipcRenderer.emit('updateBot', bot); break;}
                    }
                    break;
                }
            }
            break;
        }
        case 'role': {
            switch (channel) {
                case 'newMember': {
                    bot.newMemberRole = { id: iID, name: iName };
                    switch (eleBool) {
                        case true: { ipcRenderer.send('updateBot', bot); break;}
                        case false: { ipcRenderer.emit('updateBot', bot); break;}
                    }
                    break;
                }
                case 'announcement': {
                    bot.announcementsRole = { id: iID, name: iName };
                    switch (eleBool) {
                        case true: { ipcRenderer.send('updateBot', bot); break;}
                        case false: { ipcRenderer.emit('updateBot', bot); break;}
                    }
                    break;
                }
            }
            break;
        }
    }
}

//tells main to execute a command
function executeCmd(str, args = []) {
    if (typeof args !=="string") {
        arg = args.splice(0, 0, str);
    }
    else {
        arg = [str, args];
    }
    switch (eleBool) {
        case true: { ipcRenderer.send('command', arg); break;}
        case false: { ipcRenderer.emit('command', arg); break;}
    }
}

//listens for main's stdout messages and appends the contents to the console tab
ipcRenderer.on('stdout', (event, arg=null) => {
    if(!eleBool) arg = event;
    appendText('mainContentItemSTDOUT', arg);
    document.getElementById('mainContentConsole').scrollTop = document.getElementById('mainContentConsole').scrollHeight;
});

//adds a bot client's shard menu to the UI
ipcRenderer.on('add-client', (event, bot=null) => {
    if(!eleBool) bot = event;
    //create the button on the sharding tab menu
    shardBtn = createElement('div', ['navbarMenuButton'], `navbarMenuButtonShard${bot.guildID}`);
        shardBtn.onclick = () => { selectSubTab(`Shard${bot.guildID}`); }
        shardBtnTxt = createElement('div', ['navbarMenuButtonText']);
            shardBtnTxt.innerHTML = `${bot.guildName}`;
            shardBtn.appendChild(shardBtnTxt);
        document.getElementById('navbarMenuSharding').appendChild(shardBtn);

    //create the UI elements of a shard's settings menu
    shardContent = createElement('div', ['mainContentSubContainer', 'flex', 'hidden'], `mainContentSubShard${bot.guildID}`);
        shardContent.appendChild(createSettingItem(bot.guildID, 'Default Voice Channel', 'dropdown', 'voiceChannel'));
        shardContent.appendChild(createSettingItem(bot.guildID, 'Music Volume', 'slider', 'vol', bot.defaultVolume));
        shardContent.appendChild(createSettingItem(bot.guildID, 'Announcements Role', 'dropdown', 'arole'));
        shardContent.appendChild(createSettingItem(bot.guildID, 'New Member Role', 'dropdown', 'role'));
        shardContent.appendChild(createSettingItem(bot.guildID, 'Default Text Channel', 'dropdown', 'textChannel'));
        shardContent.appendChild(createSettingItem(bot.guildID, 'Welcome Message', 'toggle', 'welcome'));
        shardContent.appendChild(createSettingItem(bot.guildID, 'Welcome Text Channel', 'dropdown', 'wtextChannel'));
        shardContent.appendChild(createSettingItem(bot.guildID, 'Rules Text Channel', 'dropdown', 'rtextChannel'));
        
        document.getElementById('mainContentSharding').appendChild(shardContent);
    
    //input handling for the slider
    document.getElementById(`sliderDV${bot.guildID}`).value = bot.defaultVolume;
    document.getElementById(`sliderDV${bot.guildID}`).oninput = () => {
        let val = document.getElementById(`sliderDV${bot.guildID}`).value;
        document.getElementById(`mainContentSettingItemSubTextDV${bot.guildID}`).innerHTML = val;
        if (!bot.dispatcher == false) { bot.dispatcher.setVolume(parseFloat(val)/100); }
        bot.defaultVolume = parseInt(val);
        switch (eleBool) {
            case true: { ipcRenderer.send('updateBot', bot); break;}
            case false: { ipcRenderer.emit('updateBot', bot); break;}
        }
    }
    
    //input handling for the toggle
    document.getElementById(`toggleWE${bot.guildID}`).checked = bot.welcomeMsg;
    document.getElementById(`toggleWE${bot.guildID}`).oninput = () => {
        let checked = document.getElementById(`toggleWE${bot.guildID}`).checked;
        bot.welcomeMsg = checked;
        switch (eleBool) {
            case true: { ipcRenderer.send('updateBot', bot); break;}
            case false: { ipcRenderer.emit('updateBot', bot); break;}
        }
    }

    //build dropdown list for voice channel setting
    for (let i of bot.voiceChannelArray) {
        let dropdownItem = createElement('a');
            dropdownItem.href = `#${i.id}`;
            dropdownItem.onclick = () => { dropdownSelectItem(`voiceChannelDropdownButton${bot.guildID}`, i.cName, i.id, bot, 'voiceChannel', ''); }
            dropdownItem.innerHTML = i.name;
        document.getElementById(`dropdownContentVC${bot.guildID}`).appendChild(dropdownItem);
        if (i.id == bot.defaultVoiceChannel.id) { document.getElementById(`voiceChannelDropdownButton${bot.guildID}`).textContent = i.cName; }
    }
    //build dropdown list for text channel settings
    for (let i of bot.textChannelArray) {
        let dropdown1Item = createElement('a');
            dropdown1Item.href = `#${i.id}`;
            dropdown1Item.innerHTML = i.name;
            dropdown1Item.onclick = () => { dropdownSelectItem(`textChannelDropdownButton${bot.guildID}`, i.cName, i.id, bot, 'textChannel', 'default'); }
        document.getElementById(`dropdownContentTX${bot.guildID}`).appendChild(dropdown1Item);
        let dropdown2Item = createElement('a');
            dropdown2Item.href = `#${i.id}`;
            dropdown2Item.innerHTML = i.name;
            dropdown2Item.onclick = () => { dropdownSelectItem(`rtextChannelDropdownButton${bot.guildID}`, i.cName, i.id, bot, 'textChannel', 'rules'); }
        document.getElementById(`dropdownContentRT${bot.guildID}`).appendChild(dropdown2Item);
        let dropdown3Item = createElement('a');
            dropdown3Item.href = `#${i.id}`;
            dropdown3Item.innerHTML = i.name;
            dropdown3Item.onclick = () => { dropdownSelectItem(`wtextChannelDropdownButton${bot.guildID}`, i.cName, i.id, bot, 'textChannel', 'welcome'); }
        document.getElementById(`dropdownContentWT${bot.guildID}`).appendChild(dropdown3Item);
        if (i.id == bot.defaultTextChannel.id) { document.getElementById(`textChannelDropdownButton${bot.guildID}`).textContent = i.cName; }
        if (i.id == bot.ruleTextChannel.id) { document.getElementById(`rtextChannelDropdownButton${bot.guildID}`).textContent = i.cName; }
        if (i.id == bot.welcomeTextChannel.id) { document.getElementById(`wtextChannelDropdownButton${bot.guildID}`).textContent = i.cName; }
    }
    //build dropdown list for role settings
    for (let i of bot.roleArray) {
        let dropdown1Item = createElement('a');
            dropdown1Item.href = `#${i.id}`;
            dropdown1Item.innerHTML = i.name;
            dropdown1Item.onclick = () => { dropdownSelectItem(`aroleDropdownButton${bot.guildID}`, i.cName, i.id, bot, 'role', 'announcement'); }
        document.getElementById(`dropdownContentAR${bot.guildID}`).appendChild(dropdown1Item);
        let dropdown2Item = createElement('a');
            dropdown2Item.href = `#${i.id}`;
            dropdown2Item.innerHTML = i.name;
            dropdown2Item.onclick = () => { dropdownSelectItem(`roleDropdownButton${bot.guildID}`, i.cName, i.id, bot, 'role', 'newMember'); }
        document.getElementById(`dropdownContentRO${bot.guildID}`).appendChild(dropdown2Item);
            if (i.id == bot.announcementsRole.id) { document.getElementById(`aroleDropdownButton${bot.guildID}`).textContent = i.cName; }
            if (i.id == bot.newMemberRole.id) { document.getElementById(`roleDropdownButton${bot.guildID}`).textContent = i.cName; }
    }
});

ipcRenderer.on('updateBotUI', (event, bot) => {
    if(!bot) bot=event;
    document.getElementById(`voiceChannelDropdownButton${bot.guildID}`).textContent = bot.defaultVoiceChannel.name || 'Select one here';
    document.getElementById(`sliderDV${bot.guildID}`).value = bot.defaultVolume;
    document.getElementById(`mainContentSettingItemSubTextDV${bot.guildID}`).innerText = bot.defaultVolume;
    document.getElementById(`aroleDropdownButton${bot.guildID}`).textContent = bot.announcementsRole.name || 'Select one here';
    document.getElementById(`roleDropdownButton${bot.guildID}`).textContent = bot.newMemberRole.name || 'Select one here';
    document.getElementById(`textChannelDropdownButton${bot.guildID}`).textContent = bot.defaultTextChannel.name || 'Select one here';
    document.getElementById(`toggleWE${bot.guildID}`).checked = bot.welcomeMsg;
    document.getElementById(`wtextChannelDropdownButton${bot.guildID}`).textContent = bot.welcomeTextChannel.name || 'Select one here';
    document.getElementById(`rtextChannelDropdownButton${bot.guildID}`).textContent = bot.ruleTextChannel.name || 'Select one here';
})

ipcRenderer.on('populated', () => {
    populated = true;    
});

ipcRenderer.on('init-backlog', (backlog) => {
    for (let i of backlog) {
        appendText('mainContentItemSTDOUT', i);
        document.getElementById('mainContentConsole').scrollTop = document.getElementById('mainContentConsole').scrollHeight;
    }
})

ipcRenderer.on('updateVol', (event, bot=null) => {
    if(!eleBool) bot = event;
    document.getElementById(`sliderDV${bot.guildID}`).value = bot.defaultVolume;
    document.getElementById(`mainContentSettingItemSubTextDV${bot.guildID}`).innerHTML = bot.defaultVolume;
});

//closes dropdowns when clicking outside the button for one. (multiples can be opened but only one will actually change
//if an item is selected)
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

//init eSender so that main can send messages here at it's own discretion. (basically just for sending stdout to the UI)
if(eleBool) ipcRenderer.send('init-eSender', 'main');