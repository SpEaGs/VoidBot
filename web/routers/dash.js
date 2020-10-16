
const router = require('express').Router();
const path = require('path');
const express = require('express');

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

router.get('/admin/renderer.js', (req, res) => {
    log(path.join(__dirname + '/renderer.js'));
    if (!req.user) {
        res.redirect('/auth/login');
    }
    if (req.user.guilds.admin === []) {
        res.render('noAdmin');
        setTimeout(res.redirect('/dash'), 10 * 10000);
    }
    else { res.sendFile(path.join(__dirname + '/renderer.js')) };
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