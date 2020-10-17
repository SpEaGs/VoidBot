
const router = require('express').Router();
const passport = require('passport');

router.get('/login', (req, res) => {
    res.render('login');
});
router.get('/logout', (req, res) => {
    req.session = null;
    req.user = null;
    res.render('logout');
});
router.get('/discord', passport.authenticate('discord'));
router.get('/discord/callback', passport.authenticate('discord', {
    failureRedirect: '/login',
    successRedirect: "/"
}));

module.exports = router;