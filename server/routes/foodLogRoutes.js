const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();

const foodLogController = require('../controllers/foodLogController');

// Apply auth middleware to all routes
router.use(auth);

// Food Log routes
// GET /api/food-logs - Get all food logs for user
router.get('/', foodLogController.getFoodLogs);

// POST /api/food-logs - Create or replace a food log
router.post('/', foodLogController.createOrReplaceFoodLog);

// GET /api/food-logs/:id - Get a specific food log
router.get('/:id', foodLogController.getFoodLogById);

// PUT /api/food-logs/:id - Update a food log (full update)
router.put('/:id', foodLogController.updateFoodLog);

// DELETE /api/food-logs/:id - Delete a food log
router.delete('/:id', foodLogController.deleteFoodLog);

// GET /api/food-logs/date/:date - Get food log for a specific date
router.get('/date/:date', foodLogController.getFoodLogByDate);

// Add item to meal: POST /api/food-logs/:date/meals/:meal/items
router.post('/:date/meals/:meal/items', foodLogController.addItemToMeal);

// Update item quantity: PUT /api/food-logs/:id/meals/:meal/items/:itemId
router.put('/:id/meals/:meal/items/:itemId', foodLogController.updateMealItem);

// Delete item: DELETE /api/food-logs/:id/meals/:meal/items/:itemId
router.delete('/:id/meals/:meal/items/:itemId', foodLogController.deleteMealItem);

module.exports = router;
