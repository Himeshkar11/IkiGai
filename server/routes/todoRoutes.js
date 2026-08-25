const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Todo routes
// GET /api/todos - Get all todos for user
router.get('/', (req, res, next) => {
  res.status(501).json({ message: 'Get todos endpoint not yet implemented' });
});

// POST /api/todos - Create a new todo
router.post('/', (req, res, next) => {
  res.status(501).json({ message: 'Create todo endpoint not yet implemented' });
});

// GET /api/todos/:id - Get a specific todo
router.get('/:id', (req, res, next) => {
  res.status(501).json({ message: 'Get todo by ID endpoint not yet implemented' });
});

// PUT /api/todos/:id - Update a todo
router.put('/:id', (req, res, next) => {
  res.status(501).json({ message: 'Update todo endpoint not yet implemented' });
});

// DELETE /api/todos/:id - Delete a todo
router.delete('/:id', (req, res, next) => {
  res.status(501).json({ message: 'Delete todo endpoint not yet implemented' });
});

module.exports = router;
