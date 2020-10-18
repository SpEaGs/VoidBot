
const router = require('express').Router();
const path = require('path');
const express = require('express');

let dir = __dirname.split('/');
let mainDir = dir.slice(0, (dir.length - 2)).join('/');
delete dir;

const appVersion = require(mainDir+'/package.json').version;

router.use('/node_modules', express.static('./node_modules'));

router.get('/', (req, res) => {
    if(!req.user) {
        res.redirect('/auth/login');
    }
    else {
        res.render('main', {user: req.user});
    }
});

router.get('/admin', (req, res) => {
    if (!req.user) {
        return res.redirect('/auth/login');
    }
    if (!req.user.guilds.admin) {
        return res.render('noAdmin');
    }
    else {
        let guilds = []
        db.query(`SELECT * FROM guilds`, (err, result) => {
            for (let i of result) {
                if(!req.user.guilds.admin.includes(i.snowflake)){
                    guilds.push(i.snowflake);
                }
            }
            res.render('admin', {user: req.user, appVersion: appVersion, guilds: JSON.stringify(guilds)});
            log(`[WEBSERVER] User ${req.user.name}#${req.user.discriminator} connected to admin panel.`);
        });
    }
});

router.get('/renderer.js', (req, res) => {
    if (!req.user) {
        res.redirect('/auth/login');
    }
    if (req.user.guilds.admin === []) {
        res.render('noAdmin');
        setTimeout(res.redirect('/dash'), 10 * 10000);
    }
    else {
        res.sendFile(mainDir+'/renderer.js');
    };
});

module.exports = router;