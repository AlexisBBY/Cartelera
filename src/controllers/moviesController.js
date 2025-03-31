const { poolPromise, sql } = require('../config/database');
const nodemailer = require('nodemailer');

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

function isValidYouTubeUrl(url) {
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i.test(url);
}

function isEmptyOrWhitespace(str) {
  return !str || str.trim().length === 0;
}

exports.addMovie = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'Debes iniciar sesión para agregar películas');
    return res.redirect('/auth/login');
  }

  try {
    let { title, description, duration, releaseDate, genre, director, cast, imageUrl, trailerUrl } = req.body;

    // Validar que los campos no estén vacíos o con solo espacios en blanco
    if ([title, description, genre, director, cast, imageUrl, trailerUrl].some(isEmptyOrWhitespace)) {
      req.flash('error', 'Todos los campos son obligatorios y no pueden estar vacíos');
      return res.redirect('/movies/add');
    }

    // Validar que el trailer sea un enlace válido de YouTube
    if (!isValidYouTubeUrl(trailerUrl)) {
      req.flash('error', 'El enlace del tráiler debe ser un enlace válido de YouTube');
      return res.redirect('/movies/add');
    }

    // Limitar los valores para evitar truncamiento
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
  }};