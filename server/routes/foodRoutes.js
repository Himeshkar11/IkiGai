const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Food routes
// GET /api/foods - Get all foods for user
router.get('/', (req, res, next) => {
  res.status(501).json({ message: 'Get foods endpoint not yet implemented' });
});

// POST /api/foods - Create a new food
router.post('/', (req, res, next) => {
  res.status(501).json({ message: 'Create food endpoint not yet implemented' });
});

// GET /api/foods/:id - Get a specific food
router.get('/:id', (req, res, next) => {
  res.status(501).json({ message: 'Get food by ID endpoint not yet implemented' });
});

// PUT /api/foods/:id - Update a food
router.put('/:id', (req, res, next) => {
  res.status(501).json({ message: 'Update food endpoint not yet implemented' });
});

// DELETE /api/foods/:id - Delete a food
router.delete('/:id', (req, res, next) => {
  res.status(501).json({ message: 'Delete food endpoint not yet implemented' });
});

module.exports = router;
