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

  return (
    <div className="page-card home-page">
      <header className="page-head home-hero">
        <div>
          <h1>{greet}{user?.name ? `, ${user.name}` : ''}</h1>
          <div className="home-hero-date">{displayDate}</div>
          <p className="home-hero-copy">
            {isToday ? 'Daily executive overview across all life domains.' : `Historical archive view for ${displayDate}.`}
          </p>
        </div>
      </header>

      <section className="overview-cards" aria-label="Domain metrics overview">
        <button
          type="button"
          className="overview-card"
          onClick={() => navigate('/')}
          aria-label={`Tasks: ${todoCompleted} of ${todoItems.length} completed`}
        >
          <div className="overview-icon" aria-hidden="true">
            <TasksIcon size={18} />
          </div>
          <div>
            <div className="overview-value">
              {todos.loading ? '…' : `${todoCompleted} / ${todoItems.length}`}
            </div>
            <div className="overview-label">TASKS COMPLETED</div>
          </div>
        </button>

        <button
          type="button"
          className="overview-card"
          onClick={() => navigate('/food')}
          aria-label={`Food: ${Math.round(foodTotals.calories)} calories recorded`}
        >
          <div className="overview-icon" aria-hidden="true">
            <FoodIcon size={18} />
          </div>
          <div>
            <div className="overview-value">
              {food.loading ? '…' : `${Math.round(foodTotals.calories)} kcal`}
            </div>
            <div className="overview-label">CALORIE INTAKE</div>
          </div>
        </button>

        <button
          type="button"
          className="overview-card"
          onClick={() => navigate('/room')}
          aria-label={`Room: ${roomAnswered} of 3 routines recorded`}
        >
          <div className="overview-icon" aria-hidden="true">
            <RoomIcon size={18} />
          </div>
          <div>
            <div className="overview-value">
              {room.loading ? '…' : `${roomAnswered} / 3`}
            </div>
            <div className="overview-label">SPACE CHECK-IN</div>
          </div>
        </button>

        <button
          type="button"
          className="overview-card"
          onClick={() => navigate('/money')}
          aria-label={`Finances: ₹${money.total} logged`}
        >
          <div className="overview-icon" aria-hidden="true">
            <MoneyIcon size={18} />
          </div>
          <div>
            <div className="overview-value">
              {money.loading ? '…' : `₹${money.total}`}
            </div>
            <div className="overview-label">{isToday ? "TODAY'S SPENDING" : 'DAY SPENDING'}</div>
          </div>
        </button>
      </section>

      <div className="home-grid">
        <div className="main-col">
          <TodoList
            selectedDate={activeDate}
            todos={todoItems}
            loading={todos.loading}
            error={todos.error}
            onChanged={refreshTodos}
            datePermission={datePermission}
          />

          <ActivityHeatmap streak={streak} refreshKey={activityRefreshKey} />

          <section className="home-modules" aria-label="Quick domain modules">
            <div className="card home-module">
              <div className="home-module-head">
                <h4>Food & Nutrition</h4>
                <button type="button" className="link" onClick={() => navigate('/food')}>Open</button>
              </div>
              {food.loading ? (
                <p className="muted">Loading nutritional log…</p>
              ) : food.error ? (
                <p className="muted">{food.error}</p>
              ) : foodCount === 0 ? (
                <div className="empty-state compact">
                  <strong>No entries recorded</strong>
                  <p className="muted">Nothing logged for this date yet.</p>
                </div>
              ) : (
                <div className="home-nutrition">
                  <div><span>Calories</span><strong>{Math.round(foodTotals.calories)} kcal</strong></div>
                  <div><span>Protein</span><strong>{Math.round(foodTotals.protein)}g</strong></div>
                  <div><span>Carbs</span><strong>{Math.round(foodTotals.carbs)}g</strong></div>
                  <div><span>Fat</span><strong>{Math.round(foodTotals.fat)}g</strong></div>
                  <div><span>Fiber</span><strong>{Math.round(foodTotals.fiber)}g</strong></div>
                </div>
              )}
            </div>

            <div className="card home-module">
              <div className="home-module-head">
                <h4>Room & Environment</h4>
                <button type="button" className="link" onClick={() => navigate('/room')}>Open</button>
              </div>
              {room.loading ? (
                <p className="muted">Loading space status…</p>
              ) : room.error ? (
                <p className="muted">{room.error}</p>
              ) : roomAnswered === 0 ? (
                <div className="empty-state compact">
                  <strong>Check-in incomplete</strong>
                  <p className="muted">Drinking water, room tidiness, and laundry not yet recorded.</p>
                </div>
              ) : (
                <ul className="home-status-list">
                  <li><span>Water</span><strong>{statusText(roomStatus.waterAvailable, 'Available', 'Unavailable')}</strong></li>
                  <li><span>Room</span><strong>{statusText(roomStatus.roomClean, 'Clean', 'Needs attention')}</strong></li>
                  <li><span>Clothes</span><strong>{statusText(roomStatus.clothesReady, 'Ready', 'Not ready')}</strong></li>
                  <li><span>Check-in</span><strong>{roomAnswered} / 3 answered</strong></li>
                </ul>
              )}
            </div>

            <div className="card home-module">
              <div className="home-module-head">
                <h4>Finances & Spending</h4>
                <button type="button" className="link" onClick={() => navigate('/money')}>Open</button>
              </div>
              {money.loading ? (
                <p className="muted">Loading spending…</p>
              ) : money.error ? (
                <p className="muted">{money.error}</p>
              ) : moneyCount === 0 ? (
                <div className="empty-state compact">
                  <strong>No transactions</strong>
                  <p className="muted">No expenses recorded for this date.</p>
                </div>
              ) : (
                <ul className="home-status-list">
                  <li><span>Total Logged</span><strong>₹{money.total}</strong></li>
                  <li><span>Transactions</span><strong>{moneyCount}</strong></li>
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
