import React, { useEffect, useState } from 'react';
import { useDate } from '../context/DateContext';
import HomeCalendar from '../components/HomeCalendar';
import TodoList from '../components/TodoList';
import QuickSummary from '../components/QuickSummary';
import { useAuth } from '../context/AuthContext';
import * as moneyService from '../services/moneyService';

const greetingForHour = (h) => {
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const localISODate = (date = new Date()) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const HomePage = () => {
  const { selectedDate } = useDate();
  const { user } = useAuth();
  const [todaySpending, setTodaySpending] = useState(0);
  const d = new Date(selectedDate);
  const displayDate = d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const greet = greetingForHour(new Date().getHours());

  useEffect(() => {
    let cancelled = false;
    moneyService
      .getTransactionsByDate(localISODate())
      .then((res) => {
        if (!cancelled) setTodaySpending(res.total ?? 0);
      })
      .catch(() => {
        if (!cancelled) setTodaySpending(0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page-card">
      <div className="page-head">
        <div>
          <h1>{greet}{user?.name ? `, ${user.name} ` : ' '}👋</h1>
          <div className="muted">{displayDate}</div>
          <div style={{ marginTop: 8, color: 'var(--muted)' }}>Let's make today count.</div>
        </div>
      </div>

      <div style={{ height: 18 }} />

      <div className="overview-cards">
        <div className="overview-card" onClick={() => (window.location.href = '/') }>
          <div className="overview-icon">☐</div>
          <div>
            <div className="overview-value">{0} / {0}</div>
            <div className="overview-label">TODOS</div>
          </div>
        </div>
        <div className="overview-card" onClick={() => (window.location.href = '/food') }>
          <div className="overview-icon">🍎</div>
          <div>
            <div className="overview-value">{0}</div>
            <div className="overview-label">FOOD</div>
          </div>
        </div>
        <div className="overview-card" onClick={() => (window.location.href = '/room') }>
          <div className="overview-icon">🏠</div>
          <div>
            <div className="overview-value">{0} / {3}</div>
            <div className="overview-label">ROOM</div>
          </div>
        </div>
        <div className="overview-card" onClick={() => (window.location.href = '/money') }>
          <div className="overview-icon">₹</div>
          <div>
            <div className="overview-value">₹{todaySpending}</div>
            <div className="overview-label">TODAY'S SPENDING</div>
          </div>
        </div>
      </div>

      <div style={{ height: 20 }} />

      <div className="home-grid">
        <div className="main-col">
          <TodoList />

          <div className="daily-summaries" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            <div className="card" style={{ padding: 14 }}>
              <h4>Food</h4>
              <div className="muted">0 meals</div>
              <div style={{ marginTop: 8 }}>
                <div className="muted">Calories</div>
                <div>0 kcal</div>
              </div>
            </div>
            <div className="card" style={{ padding: 14 }}>
              <h4>Room</h4>
              <div className="muted">0 / 3 completed</div>
            </div>
            <div className="card" style={{ padding: 14 }}>
              <h4>Money</h4>
              <div className="muted">₹{todaySpending} today</div>
            </div>
          </div>
        </div>

        <aside className="side-col">
          <HomeCalendar />
          <QuickSummary />
        </aside>
      </div>
    </div>
  );
};

export default HomePage;
