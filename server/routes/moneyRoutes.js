const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Money routes
// GET /api/money - Get all money transactions for user
router.get('/', (req, res, next) => {
  res.status(501).json({ message: 'Get money transactions endpoint not yet implemented' });
});

// POST /api/money - Create a new money transaction
router.post('/', (req, res, next) => {
  res.status(501).json({ message: 'Create money transaction endpoint not yet implemented' });
});

// GET /api/money/:id - Get a specific money transaction
router.get('/:id', (req, res, next) => {
  res.status(501).json({ message: 'Get money transaction by ID endpoint not yet implemented' });
});

// PUT /api/money/:id - Update a money transaction
router.put('/:id', (req, res, next) => {
  res.status(501).json({ message: 'Update money transaction endpoint not yet implemented' });
});

// DELETE /api/money/:id - Delete a money transaction
router.delete('/:id', (req, res, next) => {
  res.status(501).json({ message: 'Delete money transaction endpoint not yet implemented' });
});

// GET /api/money/summary/:period - Get money summary (daily, weekly, monthly)
router.get('/summary/:period', (req, res, next) => {
  res.status(501).json({ message: 'Get money summary endpoint not yet implemented' });
});

module.exports = router;
