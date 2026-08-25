import React, { useMemo, useState } from 'react';
import { useDate } from '../context/DateContext';

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

function formatISO(date) {
  return date.toISOString().slice(0,10);
}

const HomeCalendar = () => {
  const { selectedDate, setSelectedDate } = useDate();
  const [view, setView] = useState(() => new Date(selectedDate));

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

  const prevMonth = () => setView(new Date(year, month - 1, 1));
  const nextMonth = () => setView(new Date(year, month + 1, 1));
  const goToday = () => {
    const t = new Date();
    setView(new Date(t.getFullYear(), t.getMonth(), 1));
    setSelectedDate(formatISO(t));
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
