const express = require('express');
const { auth } = require('../middleware/auth');
const { getStreak } = require('../controllers/streakController');

const router = express.Router();

router.use(auth);
router.get('/', getStreak);

module.exports = router;