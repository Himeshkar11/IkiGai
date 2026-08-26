const express = require('express');
const { auth } = require('../middleware/auth');
const moneyController = require('../controllers/moneyController');

const router = express.Router();

router.use(auth);

// GET /api/money?date=YYYY-MM-DD — transactions + server-calculated total
router.get('/', moneyController.getTransactionsByDate);

// POST /api/money
router.post('/', moneyController.createTransaction);

// PUT /api/money/:id
router.put('/:id', moneyController.updateTransaction);

// DELETE /api/money/:id
router.delete('/:id', moneyController.deleteTransaction);

module.exports = router;
