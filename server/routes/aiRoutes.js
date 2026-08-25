const express = require('express');

const { auth } = require('../middleware/auth');
const aiController = require('../controllers/aiController');

const router = express.Router();

// All AI routes require authentication
router.use(auth);

// POST /api/ai/food-parser
router.post('/food-parser', aiController.parseFood);

module.exports = router;