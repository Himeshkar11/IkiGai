const mongoose = require('mongoose');
const MoneyTransaction = require('../models/MoneyTransaction');

const pad = (n) => String(n).padStart(2, '0');

const toDayString = (value) => {
  if (!value) return null;
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

const dayBounds = (day) => ({
  start: new Date(`${day}T00:00:00.000Z`),
  end: new Date(`${day}T23:59:59.999Z`),
});

const monthBounds = (day) => {
  const [year, month] = day.split('-').map(Number);
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)),
    key: `${year}-${pad(month)}`,
  };
};

const monthlyTotalForUser = async (userId, day) => {
  const { start, end, key } = monthBounds(day);
  const [agg] = await MoneyTransaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(String(userId)),
        date: { $gte: start, $lte: end },
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return { month: key, monthlyTotal: agg?.total || 0 };
};

const sumAmounts = (transactions) =>
  transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

const parseAmount = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }
  return amount;
};

// GET /api/money?date=YYYY-MM-DD
const getTransactionsByDate = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const day = toDayString(req.query.date);
    if (!day) {
      return res.status(400).json({
        success: false,
        message: 'A valid date query (YYYY-MM-DD) is required',
      });
    }

    const { start, end } = dayBounds(day);
    const [transactions, monthSummary] = await Promise.all([
      MoneyTransaction.find({
        userId,
        date: { $gte: start, $lte: end },
      }).sort({ createdAt: 1 }),
      monthlyTotalForUser(userId, day),
    ]);

    res.status(200).json({
      success: true,
      date: day,
      transactions,
      total: sumAmounts(transactions),
      month: monthSummary.month,
      monthlyTotal: monthSummary.monthlyTotal,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/money
const createTransaction = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const description = String(req.body.description || '').trim();
    const amount = parseAmount(req.body.amount);
    const day = toDayString(req.body.date);

    if (!description) {
      return res.status(400).json({ success: false, message: 'Description is required' });
    }
    if (amount === null) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
    }
    if (!day) {
      return res.status(400).json({ success: false, message: 'A valid date (YYYY-MM-DD) is required' });
    }

    const transaction = await MoneyTransaction.create({
      userId,
      description,
      amount,
      date: dayBounds(day).start,
    });

    res.status(201).json({ success: true, transaction });
  } catch (error) {
    next(error);
  }
};

// PUT /api/money/:id
const updateTransaction = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    const updates = {};
    if (req.body.description !== undefined) {
      const description = String(req.body.description).trim();
      if (!description) {
        return res.status(400).json({ success: false, message: 'Description is required' });
      }
      updates.description = description;
    }
    if (req.body.amount !== undefined) {
      const amount = parseAmount(req.body.amount);
      if (amount === null) {
        return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
      }
      updates.amount = amount;
    }
    if (req.body.date !== undefined) {
      const day = toDayString(req.body.date);
      if (!day) {
        return res.status(400).json({ success: false, message: 'A valid date (YYYY-MM-DD) is required' });
      }
      updates.date = dayBounds(day).start;
    }

    const transaction = await MoneyTransaction.findOneAndUpdate(
      { _id: id, userId },
      updates,
      { new: true, runValidators: true },
    );

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.status(200).json({ success: true, transaction });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/money/:id
const deleteTransaction = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    const transaction = await MoneyTransaction.findOneAndDelete({ _id: id, userId });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.status(200).json({ success: true, message: 'Transaction deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactionsByDate,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
