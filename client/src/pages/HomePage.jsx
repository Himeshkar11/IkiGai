import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDate } from '../context/DateContext';
import { useAuth } from '../context/AuthContext';
import HomeCalendar from '../components/HomeCalendar';
import TodoList from '../components/TodoList';
import useHomeDashboard, { foodTotalsFromLog, mealItemCount } from '../hooks/useHomeDashboard';

const greetingForHour = (h) => {
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const localISODate = (date = new Date()) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const formatDisplayDate = (iso) => {
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
};

const statusText = (value, yes, no) => {
  if (value === true) return yes;
  if (value === false) return no;
  return 'Not set';
};

const HomePage = () => {
  const { selectedDate } = useDate();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { todos, food, room, money, refreshTodos } = useHomeDashboard(selectedDate);

  const greet = greetingForHour(new Date().getHours());
  const isToday = selectedDate === localISODate();
  const displayDate = formatDisplayDate(selectedDate);

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
      <div className="page-head home-hero">
        <div>
          <h1>{greet}{user?.name ? `, ${user.name} ` : ' '}👋</h1>
          <div className="home-hero-date">{displayDate}</div>
          <p className="home-hero-copy">
            {isToday ? "Let's make today count." : 'Viewing this day across every module.'}
          </p>
        </div>
      </div>

      

      <div className="overview-cards">
        <div className="overview-card" onClick={() => navigate('/')}>
          <div className="overview-icon">☐</div>
          <div>
            <div className="overview-value">
              {todos.loading ? '…' : `${todoCompleted} / ${todoItems.length}`}
            </div>
            <div className="overview-label">TODOS</div>
          </div>
        </div>
        <div className="overview-card" onClick={() => navigate('/food')}>
          <div className="overview-icon">🍎</div>
          <div>
            <div className="overview-value">
              {food.loading ? '…' : `${Math.round(foodTotals.calories)} kcal`}
            </div>
            <div className="overview-label">FOOD</div>
          </div>
        </div>
        <div className="overview-card" onClick={() => navigate('/room')}>
          <div className="overview-icon">🏠</div>
          <div>
            <div className="overview-value">
              {room.loading ? '…' : `${roomAnswered} / 3`}
            </div>
            <div className="overview-label">ROOM</div>
          </div>
        </div>
        <div className="overview-card" onClick={() => navigate('/money')}>
          <div className="overview-icon">₹</div>
          <div>
            <div className="overview-value">
              {money.loading ? '…' : `₹${money.total}`}
            </div>
            <div className="overview-label">{isToday ? "TODAY'S SPENDING" : 'SPENDING'}</div>
          </div>
        </div>
      </div>

      

      <div className="home-grid">
        <div className="main-col">
          <TodoList
            selectedDate={selectedDate}
            todos={todoItems}
            loading={todos.loading}
            error={todos.error}
            onChanged={refreshTodos}
          />

          <div className="home-modules">
            <section className="card home-module">
              <div className="home-module-head">
                <h4>Food</h4>
                <button type="button" className="link" onClick={() => navigate('/food')}>Open</button>
              </div>
              {food.loading ? (
                <p className="muted">Loading food…</p>
              ) : food.error ? (
                <p className="muted">{food.error}</p>
              ) : foodCount === 0 ? (
                <div className="empty-state compact">
                  <strong>No food logged</strong>
                  <p className="muted">Nothing recorded for this day.</p>
                </div>
              ) : (
                <div className="home-nutrition">
                  <div><span>Calories</span><strong>{Math.round(foodTotals.calories)}</strong></div>
                  <div><span>Protein</span><strong>{Math.round(foodTotals.protein)}g</strong></div>
                  <div><span>Carbs</span><strong>{Math.round(foodTotals.carbs)}g</strong></div>
                  <div><span>Fat</span><strong>{Math.round(foodTotals.fat)}g</strong></div>
                  <div><span>Fiber</span><strong>{Math.round(foodTotals.fiber)}g</strong></div>
                </div>
              )}
            </section>

            <section className="card home-module">
              <div className="home-module-head">
                <h4>Room</h4>
                <button type="button" className="link" onClick={() => navigate('/room')}>Open</button>
              </div>
              {room.loading ? (
                <p className="muted">Loading room…</p>
              ) : room.error ? (
                <p className="muted">{room.error}</p>
              ) : roomAnswered === 0 ? (
                <div className="empty-state compact">
                  <strong>No room status</strong>
                  <p className="muted">Water, room, and clothes are not set for this day.</p>
                </div>
              ) : (
                <ul className="home-status-list">
                  <li><span>Water</span><strong>{statusText(roomStatus.waterAvailable, 'Available', 'Unavailable')}</strong></li>
                  <li><span>Room</span><strong>{statusText(roomStatus.roomClean, 'Clean', 'Not clean')}</strong></li>
                  <li><span>Clothes</span><strong>{statusText(roomStatus.clothesReady, 'Ready', 'Not ready')}</strong></li>
                  <li><span>Completion</span><strong>{roomAnswered} / 3</strong></li>
                </ul>
              )}
            </section>

            <section className="card home-module">
              <div className="home-module-head">
                <h4>Money</h4>
                <button type="button" className="link" onClick={() => navigate('/money')}>Open</button>
              </div>
              {money.loading ? (
                <p className="muted">Loading spending…</p>
              ) : money.error ? (
                <p className="muted">{money.error}</p>
              ) : moneyCount === 0 ? (
                <div className="empty-state compact">
                  <strong>No spending</strong>
                  <p className="muted">No transactions for this day.</p>
                </div>
              ) : (
                <ul className="home-status-list">
                  <li><span>{isToday ? "Today's spending" : 'Spending'}</span><strong>₹{money.total}</strong></li>
                  <li><span>Transactions</span><strong>{moneyCount}</strong></li>
                </ul>
              )}
            </section>
          </div>
        </div>

        <aside className="side-col">
          <HomeCalendar />
        </aside>
      </div>
    </div>
  );
};

export default HomePage;
