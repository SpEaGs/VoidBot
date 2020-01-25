
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

function appendHTML(el, str) {
    let div = document.createElement('div');
    div.innerHTML = str;
    while(div.children.length > 0) {
        el.appendChild(div.children[0]);
    }
}

function appendText(elementID, str) {
    document.getElementById(elementID).innerHTML += (' > '+str+'<br>');
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

ipcRenderer.send('init-eSender', 'main');