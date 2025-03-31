const passport = require('passport'); // Agrega esta línea al inicio

exports.loginForm = (req, res) => {
  res.render('auth/login');
};

exports.login = passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/auth/login',
  failureFlash: true
});

exports.logout = (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.flash('success', 'Has cerrado sesión');
    res.redirect('/');
  });
};