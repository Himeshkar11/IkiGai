import React, { useEffect, useState } from 'react';
import { useDate } from '../context/DateContext';
import * as moneyService from '../services/moneyService';

const QuickSummary = () => {
  const { selectedDate } = useDate();

  // Placeholder summary counts. In future hook up to API.
  const foodCount = 0;
  const roomCount = 0;
  const [moneyTotal, setMoneyTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    moneyService
      .getTransactionsByDate(selectedDate)
      .then((res) => {
        if (!cancelled) setMoneyTotal(res.total ?? 0);
      })
      .catch(() => {
        if (!cancelled) setMoneyTotal(0);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  return (
    <div className="card summary-card">
      <div className="summary-head">
        <h3>Daily Summary</h3>
        <div className="summary-date">{new Date(selectedDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</div>
      </div>
      <div className="summary-grid">
        <div className="overview-card" onClick={() => { window.location.href = '/food'; }}>
          <div className="overview-icon">🍎</div>
          <div className="overview-body"><div className="overview-value">{foodCount}</div><div className="overview-label">meals</div></div>
        </div>
        <div className="overview-card" onClick={() => { window.location.href = '/room'; }}>
          <div className="overview-icon">🏠</div>
          <div className="overview-body"><div className="overview-value">{roomCount}</div><div className="overview-label">items</div></div>
        </div>
        <div className="overview-card" onClick={() => { window.location.href = '/money'; }}>
          <div className="overview-icon">₹</div>
            <div className="overview-body"><div className="overview-value">₹{moneyTotal}</div><div className="overview-label">spent</div></div>
        </div>
      </div>
    </div>
  );
};

export default QuickSummary;
