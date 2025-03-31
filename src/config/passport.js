const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// Usuario de prueba
const testUser = {
  username: 'alexis',
  password: '123', // No cifrado, solo para pruebas
};

// Configurar Passport con la estrategia local
passport.use(new LocalStrategy(
  (username, password, done) => {
    if (username === testUser.username && password === testUser.password) {
      return done(null, testUser); // El usuario es válido
    } else {
      return done(null, false, { message: 'Credenciales incorrectas' }); // Usuario no válido
    }
  }
));

// Serialización y deserialización del usuario
passport.serializeUser((user, done) => {
  done(null, user.username); // Guardamos el username como identificador
});

passport.deserializeUser((username, done) => {
  if (username === testUser.username) {
    return done(null, testUser); // Recuperamos el usuario de prueba
  }
  return done(null, false); // No se encontró el usuario
});
