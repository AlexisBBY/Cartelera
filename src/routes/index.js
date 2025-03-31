const express = require('express');
const router = express.Router();
const moviesController = require('../controllers/moviesController');

router.get('/', moviesController.listMovies);
router.get('/movies', moviesController.listMovies);
router.get('/movies/add', moviesController.addMovieForm);
router.post('/movies/add', moviesController.addMovie);


module.exports = router;