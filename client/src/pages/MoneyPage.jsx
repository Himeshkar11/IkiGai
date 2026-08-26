import React, { useEffect, useState } from 'react';
import { useDate } from '../context/DateContext';
import HomeCalendar from '../components/HomeCalendar';
import * as moneyService from '../services/moneyService';

const pad = (n) => String(n).padStart(2, '0');

const localISODate = (d = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const addDays = (iso, delta) => {
  const [y, m, d] = iso.split('-').map(Number);
  const next = new Date(y, m - 1, d + delta);
  return localISODate(next);
};

const formatRupee = (n) => `₹${Number(n) || 0}`;

const MoneyPage = () => {
  const { selectedDate, setSelectedDate } = useDate();
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');

  const fetchDay = async (date) => {
    setLoading(true);
    setError(null);
    try {
      const res = await moneyService.getTransactionsByDate(date);
      setTransactions(res.transactions || []);
      setTotal(res.total ?? 0);
      setMonthlyTotal(res.monthlyTotal ?? 0);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load spending');
      setTransactions([]);
      setTotal(0);
      setMonthlyTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDay(selectedDate);
    setEditingId(null);
  }, [selectedDate]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const desc = description.trim();
    const amt = Number(amount);
    if (!desc || !Number.isFinite(amt) || amt <= 0) return;

    setSubmitting(true);
    setError(null);
    try {
      await moneyService.createTransaction({
        description: desc,
        amount: amt,
        date: selectedDate,
      });
      setDescription('');
      setAmount('');
      await fetchDay(selectedDate);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (tx) => {
    setEditingId(tx._id);
    setEditDescription(tx.description);
    setEditAmount(String(tx.amount));
  };

  const saveEdit = async (id) => {
    const desc = editDescription.trim();
    const amt = Number(editAmount);
    if (!desc || !Number.isFinite(amt) || amt <= 0) return;
    setError(null);
    try {
      await moneyService.updateTransaction(id, { description: desc, amount: amt });
      setEditingId(null);
      await fetchDay(selectedDate);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update transaction');
    }
  };

  const handleDelete = async (id) => {
    setError(null);
    try {
      await moneyService.deleteTransaction(id);
      await fetchDay(selectedDate);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete transaction');
    }
  };

  const displayDate = (() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
    });
  })();

  const displayMonth = (() => {
    const [y, m] = selectedDate.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  })();

  return (
    <div className="page-card money-page">
      <p className="eyebrow">Spending</p>
      <h1>Money</h1>
      <div className="money-month-total">
        <span className="muted">{displayMonth}</span>
        <strong>{formatRupee(monthlyTotal)}</strong>
      </div>
      <div className="food-date">{displayDate}</div>

      <div className="date-nav">
        <button type="button" className="link" onClick={() => setSelectedDate(addDays(selectedDate, -1))}>
          ← Previous
        </button>
        <button type="button" className="btn" onClick={() => setSelectedDate(localISODate())}>
          Today
        </button>
        <button type="button" className="link" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
          Next →
        </button>
      </div>

      <div className="money-layout">
        <div className="money-main">
          <form className="money-form" onSubmit={handleAdd}>
            <label className="field">
              <span className="field-label">What did you buy?</span>
              <input
                className="task-input"
                type="text"
                placeholder="Coffee"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label">Amount</span>
              <input
                className="task-input"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="120"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <button
              type="submit"
              className="btn primary"
              disabled={submitting || !description.trim() || !amount}
            >
              {submitting ? 'Adding…' : '+ Add'}
            </button>
          </form>

          {error && <div className="card error">{error}</div>}

          {loading ? (
            <div className="card">Loading spending…</div>
          ) : (
            <>
              {transactions.length === 0 ? (
                <div className="empty-state">No spending logged for this day</div>
              ) : (
                <ul className="money-list">
                  {transactions.map((tx) => (
                    <li key={tx._id} className="money-row">
                      {editingId === tx._id ? (
                        <>
                          <input
                            className="task-input"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            autoFocus
                          />
                          <input
                            className="task-input money-amount-input"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                          />
                          <div className="actions">
                            <button type="button" className="link" onClick={() => setEditingId(null)}>
                              Cancel
                            </button>
                            <button type="button" className="btn primary" onClick={() => saveEdit(tx._id)}>
                              Save
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="money-desc">{tx.description}</span>
                          <span className="money-amt">{formatRupee(tx.amount)}</span>
                          <div className="actions">
                            <button type="button" className="link" onClick={() => startEdit(tx)}>
                              Edit
                            </button>
                            <button type="button" className="link danger" onClick={() => handleDelete(tx._id)}>
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              <div className="money-total">
                <span>TOTAL</span>
                <span>{formatRupee(total)}</span>
              </div>
            </>
          )}
        </div>

        <aside className="money-side">
          <HomeCalendar />
        </aside>
      </div>
    </div>
  );
};

export default MoneyPage;
