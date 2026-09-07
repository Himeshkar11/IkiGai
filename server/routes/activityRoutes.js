const express = require('express');
const { auth } = require('../middleware/auth');
const { getMonthActivity } = require('../controllers/activityController');

const router = express.Router();

router.use(auth);
router.get('/', getMonthActivity);

module.exports = router;