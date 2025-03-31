const express = require('express');
const router = express.Router();
const moviesController = require('../controllers/moviesController');
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware');

// Rutas públicas
router.get('/', moviesController.listMovies);
router.get('/:id', moviesController.movieDetails);

// Rutas protegidas para administradores
router.get('/add', isAuthenticated, isAdmin, moviesController.addMovieForm);
router.post('/add', isAuthenticated, isAdmin, moviesController.addMovie);
router.post('/:id/delete', isAuthenticated, isAdmin, moviesController.deleteMovie);
router.get('/edit/:id', moviesController.editMovieForm);  // Corregido para usar moviesController

// Ruta para procesar la edición
router.post('/edit/:id', moviesController.editMovie);  // Corregido para usar moviesController

module.exports = router;
