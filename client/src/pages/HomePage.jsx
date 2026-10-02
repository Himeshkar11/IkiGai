import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDate } from '../context/DateContext';
import { useAuth } from '../context/AuthContext';
import TodoList from '../components/TodoList';
import ActivityHeatmap from '../components/ActivityHeatmap';
import useHomeDashboard, { foodTotalsFromLog, mealItemCount } from '../hooks/useHomeDashboard';
import { formatCalendarDisplay, getDatePermission, parseCalendarDate } from '../utils/activity';
import {
  TasksIcon,
  FoodIcon,
  RoomIcon,
  MoneyIcon,
} from '../components/Icons';

const greetingForHour = (h) => {
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const statusText = (value, yes, no) => {
  if (value === true) return yes;
  if (value === false) return no;
  return 'Not set';
};

const HomePage = () => {
  const { selectedDate, setSelectedDate } = useDate();
  const { date: routeDateParam } = useParams();
  const parsedRouteDate = parseCalendarDate(routeDateParam);
  const activeDate = parsedRouteDate || selectedDate;

  useEffect(() => {
    if (parsedRouteDate && parsedRouteDate !== selectedDate) {
      setSelectedDate(parsedRouteDate);
    }
  }, [parsedRouteDate, selectedDate, setSelectedDate]);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { todos, food, room, money, streak, activityRefreshKey, refreshTodos } = useHomeDashboard(activeDate);

  const greet = greetingForHour(new Date().getHours());
  const displayName = (user?.name && user.name.trim()) || (user?.email ? user.email.split('@')[0].trim() : '');
  const greetingText = displayName ? `${greet}, ${displayName}` : greet;
  const datePermission = getDatePermission(activeDate);
  const isToday = datePermission === 'today';
  const displayDate = formatCalendarDisplay(activeDate);

  const todoItems = todos.items || [];
  const todoCompleted = todoItems.filter((t) => t.completed).length;
  const foodTotals = foodTotalsFromLog(food.log);
  const foodCount = mealItemCount(food.log);
  const roomStatus = room.status || {};
  const roomAnswered =
    Number(roomStatus.waterAvailable !== null && roomStatus.waterAvailable !== undefined) +
    Number(roomStatus.roomClean !== null && roomStatus.roomClean !== undefined) +
    Number(roomStatus.clothesReady !== null && roomStatus.clothesReady !== undefined);
  const moneyCount = money.transactions.length;

  const tasksContextText =
    todoItems.length === 0
      ? 'No tasks logged'
      : todoCompleted === todoItems.length
      ? 'All items done'
      : `${todoItems.length - todoCompleted} remaining`;

  const calorieGoal = 2100;
  const calorieContextText = `${Math.round(foodTotals.calories)} / ${calorieGoal} kcal`;

  return (
    <div className="home-container">
      {/* Editorial Header */}
      <header className="home-hero">
        <div className="home-hero-content">
          <div className="home-hero-meta">
            <span className="mono-date-pill">{displayDate}</span>
            {isToday ? (
              <span className="active-day-tag">Today</span>
            ) : (
              <span className="archive-day-tag">Archive View</span>
            )}
          </div>
          <h1 className="home-greeting">
            {greetingText}
          </h1>
          <p className="home-hero-hint">
            {isToday
              ? `${tasksContextText} · Focus on high-leverage execution today.`
              : `Reviewing record for ${displayDate}. View-only historical mode.`}
          </p>
        </div>
      </header>

      {/* Slim Inline Metrics Strip */}
      <section className="metrics-strip" aria-label="Domain metrics strip">
        <button
          type="button"
          className="metric-item metric-tasks"
          onClick={() => navigate('/')}
          aria-label={`Tasks: ${todoCompleted} of ${todoItems.length} completed`}
        >
          <div className="metric-header">
            <TasksIcon size={14} className="metric-inline-icon" />
            <span className="metric-label">TASKS</span>
          </div>
          <div className="metric-value-row">
            <span className="metric-number">
              {todos.loading ? '…' : `${todoCompleted} / ${todoItems.length}`}
            </span>
          </div>
          <span className="metric-context">{tasksContextText}</span>
        </button>

        <div className="metric-divider" aria-hidden="true" />

        <button
          type="button"
          className="metric-item metric-food"
          onClick={() => navigate('/food')}
          aria-label={`Nutrition: ${calorieContextText}`}
        >
          <div className="metric-header">
            <FoodIcon size={14} className="metric-inline-icon" />
            <span className="metric-label">NUTRITION</span>
          </div>
          <div className="metric-value-row">
            <span className="metric-number">
              {food.loading ? '…' : calorieContextText}
            </span>
          </div>
          <span className="metric-context">
            {foodCount === 0 ? 'No meals logged' : `${Math.round(foodTotals.protein)}g protein`}
          </span>
        </button>

        <div className="metric-divider" aria-hidden="true" />

        <button
          type="button"
          className="metric-item metric-room"
          onClick={() => navigate('/room')}
          aria-label={`Habits: ${roomAnswered} of 3 completed`}
        >
          <div className="metric-header">
            <RoomIcon size={14} className="metric-inline-icon" />
            <span className="metric-label">ENVIRONMENT</span>
          </div>
          <div className="metric-value-row">
            <span className="metric-number">
              {room.loading ? '…' : `${roomAnswered} / 3`}
            </span>
          </div>
          <span className="metric-context">
            {roomAnswered === 3 ? 'Routines checked' : `${3 - roomAnswered} unchecked`}
          </span>
        </button>

        <div className="metric-divider" aria-hidden="true" />

        <button
          type="button"
          className="metric-item metric-money"
          onClick={() => navigate('/money')}
          aria-label={`Finances: ₹${money.total} logged`}
        >
          <div className="metric-header">
            <MoneyIcon size={14} className="metric-inline-icon" />
            <span className="metric-label">SPENDING</span>
          </div>
          <div className="metric-value-row">
            <span className="metric-number">
              {money.loading ? '…' : `₹${money.total}`}
            </span>
          </div>
          <span className="metric-context">
            {moneyCount === 0 ? '₹0 recorded' : `${moneyCount} logged`}
          </span>
        </button>
      </section>

      {/* Dominant Focus Area: Tasks & Heatmap */}
      <div className="home-main-layout">
        <div className="home-focus-column">
          <TodoList
            selectedDate={activeDate}
            todos={todoItems}
            loading={todos.loading}
            error={todos.error}
            onChanged={refreshTodos}
            datePermission={datePermission}
          />

          <ActivityHeatmap streak={streak} refreshKey={activityRefreshKey} />

          {/* Quick Domain Summary Cards */}
          <section className="home-modules-strip" aria-label="Domain details">
            <div className="home-domain-card domain-food-card">
              <div className="home-domain-header">
                <div className="domain-title-wrap">
                  <span className="domain-dot dot-food" aria-hidden="true" />
                  <h4>Food & Nutrition</h4>
                </div>
                <button type="button" className="domain-open-btn" onClick={() => navigate('/food')}>
                  Open →
                </button>
              </div>

              {food.loading ? (
                <p className="muted">Loading log…</p>
              ) : food.error ? (
                <p className="muted">{food.error}</p>
              ) : foodCount === 0 ? (
                <div className="domain-empty">
                  <span>Nothing recorded for this date.</span>
                  <button type="button" className="link-subtle" onClick={() => navigate('/food')}>
                    + Log food
                  </button>
                </div>
              ) : (
                <div className="home-nutrition-grid">
                  <div className="nutrition-cell">
                    <span className="nutri-label">Calories</span>
                    <strong className="nutri-val">{Math.round(foodTotals.calories)} kcal</strong>
                  </div>
                  <div className="nutrition-cell">
                    <span className="nutri-label">Protein</span>
                    <strong className="nutri-val">{Math.round(foodTotals.protein)}g</strong>
                  </div>
                  <div className="nutrition-cell">
                    <span className="nutri-label">Carbs</span>
                    <strong className="nutri-val">{Math.round(foodTotals.carbs)}g</strong>
                  </div>
                  <div className="nutrition-cell">
                    <span className="nutri-label">Fat</span>
                    <strong className="nutri-val">{Math.round(foodTotals.fat)}g</strong>
                  </div>
                </div>
              )}
            </div>

            <div className="home-domain-card domain-room-card">
              <div className="home-domain-header">
                <div className="domain-title-wrap">
                  <span className="domain-dot dot-room" aria-hidden="true" />
                  <h4>Room & Habits</h4>
                </div>
                <button type="button" className="domain-open-btn" onClick={() => navigate('/room')}>
                  Open →
                </button>
              </div>

              {room.loading ? (
                <p className="muted">Loading status…</p>
              ) : room.error ? (
                <p className="muted">{room.error}</p>
              ) : roomAnswered === 0 ? (
                <div className="domain-empty">
                  <span>Check-in incomplete.</span>
                  <button type="button" className="link-subtle" onClick={() => navigate('/room')}>
                    Check in →
                  </button>
                </div>
              ) : (
                <ul className="domain-status-list">
                  <li>
                    <span>Water</span>
                    <strong>{statusText(roomStatus.waterAvailable, 'Available', 'Unavailable')}</strong>
                  </li>
                  <li>
                    <span>Room</span>
                    <strong>{statusText(roomStatus.roomClean, 'Clean', 'Attention')}</strong>
                  </li>
                  <li>
                    <span>Laundry</span>
                    <strong>{statusText(roomStatus.clothesReady, 'Ready', 'Pending')}</strong>
                  </li>
                </ul>
              )}
            </div>

            <div className="home-domain-card domain-money-card">
              <div className="home-domain-header">
                <div className="domain-title-wrap">
                  <span className="domain-dot dot-money" aria-hidden="true" />
                  <h4>Finances</h4>
                </div>
                <button type="button" className="domain-open-btn" onClick={() => navigate('/money')}>
                  Open →
                </button>
              </div>

              {money.loading ? (
                <p className="muted">Loading…</p>
              ) : money.error ? (
                <p className="muted">{money.error}</p>
              ) : moneyCount === 0 ? (
                <div className="domain-empty">
                  <span>No expenses logged today.</span>
                  <button type="button" className="link-subtle" onClick={() => navigate('/money')}>
                    + Log expense
                  </button>
                </div>
              ) : (
                <ul className="domain-status-list">
                  <li>
                    <span>Total Logged</span>
                    <strong>₹{money.total}</strong>
                  </li>
                  <li>
                    <span>Transactions</span>
                    <strong>{moneyCount}</strong>
                  </li>
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
