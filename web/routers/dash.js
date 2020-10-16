
const router = require('express').Router();
const path = require('path');
const express = require('express');
const { log } = require('util');

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
        res.render('admin', {user: req.user});
    }
})

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
        log(pathOut);
        res.sendFile(pathOut);
    };
})
/*router.get('/admin/index.css', (req, res) => {
    if (!req.user) {
        res.redirect('/auth/login');
    }
    if (req.user.guilds.admin === []) {
        res.render('noAdmin');
        setTimeout(res.redirect('/dash'), 10 * 10000);
    }
    else { res.sendFile('.../index.css') };
})*/

module.exports = router;