import React, { useMemo, useState } from 'react';
import { useDate } from '../context/DateContext';
import { getLogicalToday } from '../utils/activity';

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

function formatISO(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const HomeCalendar = () => {
  const { selectedDate, setSelectedDate } = useDate();
  const [view, setView] = useState(() => {
    const parts = String(selectedDate || '').split('-').map(Number);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return new Date(parts[0], parts[1] - 1, 1, 12);
    }
    return new Date();
  });

  const year = view.getFullYear();
  const month = view.getMonth();

  const weeks = useMemo(() => {
    const first = startOfMonth(view);
    const last = endOfMonth(view);
    const cells = [];
    // backfill from first day
    let cur = new Date(first);
    cur.setDate(cur.getDate() - cur.getDay());
    while (cur <= last || cur.getDay() !== 0) {
      cells.push(new Date(cur));
      cur = new Date(cur);
      cur.setDate(cur.getDate() + 1);
    }
    return cells;
  }, [view]);

  const prevMonth = () => setView(new Date(year, month - 1, 1, 12));
  const nextMonth = () => setView(new Date(year, month + 1, 1, 12));
  const goToday = () => {
    const todayStr = getLogicalToday();
    const parts = todayStr.split('-').map(Number);
    setView(new Date(parts[0], parts[1] - 1, 1, 12));
    setSelectedDate(todayStr);
  };

  return (
    <div className="card calendar-card">
      <div className="calendar-header">
        <button onClick={prevMonth}>◀</button>
        <strong>{view.toLocaleString(undefined, { month: 'long' })} {year}</strong>
        <button onClick={nextMonth}>▶</button>
        <button className="today-btn" onClick={goToday}>Today</button>
      </div>

      <div className="calendar-grid">
        {DAYS.map((d) => <div key={d} className="calendar-cell head">{d}</div>)}
        {weeks.map((date) => {
          const iso = formatISO(date);
          const isCurrentMonth = date.getMonth() === month;
          const selected = iso === selectedDate;
          return (
            <div key={iso} className={`calendar-cell ${isCurrentMonth ? '' : 'muted'} ${selected ? 'selected' : ''}`} onClick={() => setSelectedDate(iso)}>
              <span className="cell-num">{date.getDate()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HomeCalendar;
