const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();

const foodController = require('../controllers/foodController');

// Apply auth middleware to all routes
router.use(auth);

// Food routes
// GET /api/foods - Get all foods for user (optional ?search=)
router.get('/', foodController.getFoods);

// POST /api/foods - Create a new food
router.post('/', foodController.createFood);

// GET /api/foods/:id - Get a specific food
router.get('/:id', foodController.getFoodById);

// PUT /api/foods/:id - Update a food
router.put('/:id', foodController.updateFood);

// DELETE /api/foods/:id - Delete a food
router.delete('/:id', foodController.deleteFood);

module.exports = router;
