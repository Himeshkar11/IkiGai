const express = require('express');
const { register, login, me } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register - Register a new user
router.post('/register', register);

// POST /api/auth/login - Login user
router.post('/login', login);

// GET /api/auth/me - Get current user (protected)
router.get('/me', auth, me);

module.exports = router;
