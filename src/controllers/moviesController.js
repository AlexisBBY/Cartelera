const { poolPromise, sql } = require('../config/database');
const nodemailer = require('nodemailer');

// Configurar el transporter para nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Función para enviar correos de error
async function sendErrorEmail(error) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: 'Error en la cartelera de cine',
    text: `Se ha producido un error: ${error.stack || error}`
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (emailError) {
    console.error('Error al enviar el correo:', emailError);
  }
}

exports.listMovies = async (req, res, next) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Movies ORDER BY CreatedAt DESC');
    res.render('movies/list', { movies: result.recordset });
  } catch (error) {
    await sendErrorEmail(error);
    next(error);
  }
};

exports.movieDetails = async (req, res, next) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM Movies WHERE Id = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).render('errors/404');
    }
    
    res.render('movies/details', { movie: result.recordset[0] });
  } catch (error) {
    await sendErrorEmail(error);
    next(error);
  }
};

exports.addMovieForm = (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'Debes iniciar sesión para agregar películas');
    return res.redirect('/auth/login');
  }
  res.render('movies/add');
};

exports.addMovie = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'Debes iniciar sesión para agregar películas');
    return res.redirect('/auth/login');
  }

  try {
    let { title, description, duration, releaseDate, genre, director, cast, imageUrl, trailerUrl } = req.body;

    // Limitar los valores para evitar truncamiento
    title = title.substring(0, 50);  // Si en la BD es VARCHAR(255)
    description = description.substring(0, 1000); // Ajustar según la BD
    genre = genre.substring(0, 100);
    director = director.substring(0, 50);
    cast = cast.substring(0, 500);
    imageUrl = imageUrl.substring(0, 255);
    trailerUrl = trailerUrl.substring(0, 255);

    const pool = await poolPromise;
    await pool.request()
      .input('title', sql.NVarChar(50), title)
      .input('description', sql.NVarChar(1000), description)
      .input('duration', sql.Int, duration)
      .input('releaseDate', sql.Date, releaseDate)
      .input('genre', sql.NVarChar(100), genre)
      .input('director', sql.NVarChar(50), director)
      .input('cast', sql.NVarChar(500), cast)
      .input('imageUrl', sql.NVarChar(255), imageUrl)
      .input('trailerUrl', sql.NVarChar(255), trailerUrl)
      .query(`INSERT INTO Movies (Title, Description, Duration, ReleaseDate, Genre, Director, Cast, ImageUrl, TrailerUrl) 
              VALUES (@title, @description, @duration, @releaseDate, @genre, @director, @cast, @imageUrl, @trailerUrl)`);

    req.flash('success', 'Película agregada correctamente');
    res.redirect('/movies');
  } catch (error) {
    await sendErrorEmail(error);
    req.flash('error', 'Error al agregar la película');
    next(error);
  }
};

exports.deleteMovie = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'Debes iniciar sesión para eliminar películas');
    return res.redirect('/auth/login');
  }

  try {
    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM Movies WHERE Id = @id');
    
    req.flash('success', 'Película eliminada correctamente');
    res.redirect('/movies');
  } catch (error) {
    await sendErrorEmail(error);
    req.flash('error', 'Error al eliminar la película');
    next(error);
  }
};

// Mostrar el formulario de edición con los detalles de la película
exports.editMovieForm = async (req, res, next) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM Movies WHERE Id = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).render('errors/404');
    }

    res.render('movies/edit', { movie: result.recordset[0] });
  } catch (error) {
    await sendErrorEmail(error);
    next(error);
  }
};

// Procesar la edición de la película
exports.editMovie = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'Debes iniciar sesión para editar películas');
    return res.redirect('/auth/login');
  }

  try {
    let { title, description, duration, releaseDate, genre, director, cast, imageUrl, trailerUrl } = req.body;

    // Limitar los valores para evitar truncamiento
    title = title.substring(0, 50);  // Si en la BD es VARCHAR(255)
    description = description.substring(0, 1000); // Ajustar según la BD
    genre = genre.substring(0, 100);
    director = director.substring(0, 50);
    cast = cast.substring(0, 500);
    imageUrl = imageUrl.substring(0, 255);
    trailerUrl = trailerUrl.substring(0, 255);

    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('title', sql.NVarChar(50), title)
      .input('description', sql.NVarChar(1000), description)
      .input('duration', sql.Int, duration)
      .input('releaseDate', sql.Date, releaseDate)
      .input('genre', sql.NVarChar(100), genre)
      .input('director', sql.NVarChar(50), director)
      .input('cast', sql.NVarChar(500), cast)
      .input('imageUrl', sql.NVarChar(255), imageUrl)
      .input('trailerUrl', sql.NVarChar(255), trailerUrl)
      .query(`UPDATE Movies 
              SET Title = @title, Description = @description, Duration = @duration, ReleaseDate = @releaseDate, 
                  Genre = @genre, Director = @director, Cast = @cast, ImageUrl = @imageUrl, TrailerUrl = @trailerUrl
              WHERE Id = @id`);

    req.flash('success', 'Película actualizada correctamente');
    res.redirect(`/movies/${req.params.id}`);
  } catch (error) {
    await sendErrorEmail(error);
    req.flash('error', 'Error al actualizar la película');
    next(error);
  }
};
