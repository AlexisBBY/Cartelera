const { poolPromise, sql } = require('../config/database');
const nodemailer = require('nodemailer');
const xss = require('xss');
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
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

function isValidInput(value) {
  return value && value.trim() !== '' && /^[a-zA-Z0-9 .,'"!?()-]+$/.test(value);
}

exports.addMovie = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'Debes iniciar sesión para agregar películas');
    return res.redirect('/auth/login');
  }

  try {
    let { title, description, duration, releaseDate, genre, director, cast, imageUrl, trailerUrl } = req.body;

    title = xss(title);
    description = xss(description);
    genre = xss(genre);
    director = xss(director);
    cast = xss(cast);
    imageUrl = xss(imageUrl);
    trailerUrl = xss(trailerUrl);

    if (!isValidInput(title) || !isValidInput(description) || !isValidInput(genre) || !isValidInput(director) || !isValidInput(cast) || !isValidInput(imageUrl) || !isValidInput(trailerUrl)) {
      req.flash('error', 'Los campos contienen caracteres no permitidos o están vacíos.');
      return res.redirect('/movies/add');
    }

    title = title.substring(0, 50);
    description = description.substring(0, 1000);
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
