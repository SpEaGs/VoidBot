
const router = require('express').Router();
const path = require('path');
const express = require('express');

const appVersion = require('./package.json').version;

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
        res.redirect('/auth/login');
    }
    if (req.user.guilds.admin === []) {
        res.render('noAdmin');
        setTimeout(res.redirect('/dash'), 10 * 1000);
    }
    else {
        db.query(`SELECT * FROM guilds`, (err, result) => {
            log(JSON.stringify(result));
        })
        res.render('admin', {user: req.user, appVersion: appVersion});
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
        let filePath = __dirname.split('/');
        let pathOut = filePath.slice(0, (filePath.length - 2)).join('/');
        res.sendFile(pathOut+'/renderer.js');
    };
});

module.exports = router;