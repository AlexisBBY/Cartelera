module.exports = {
  isAuthenticated: (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    req.flash('error', 'Por favor inicia sesión primero');
    res.redirect('/auth/login');
  },

  isAdmin: (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    req.flash('error', 'Acceso denegado: se requieren privilegios de administrador');
    res.redirect('/');
  }
};