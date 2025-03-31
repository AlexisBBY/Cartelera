const { sendErrorEmail } = require('../controllers/moviesController');

module.exports = (err, req, res, next) => {
  // Enviar correo con el error
  sendErrorEmail(err);
  
  // Configurar el código de estado
  const statusCode = err.statusCode || 500;
  
  // Mostrar página de error
  res.status(statusCode);
  
  if (req.accepts('html')) {
    res.render('errors/' + statusCode, {
      title: `Error ${statusCode}`,
      error: err
    });
  } else if (req.accepts('json')) {
    res.json({ error: err.message });
  } else {
    res.type('txt').send(err.message);
  }
};