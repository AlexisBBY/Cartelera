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

module.exports = router;