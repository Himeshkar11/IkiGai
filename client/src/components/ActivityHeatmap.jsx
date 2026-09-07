import React, { useEffect, useMemo, useState } from 'react';
import { useDate } from '../context/DateContext';
import * as activityService from '../services/activityService';
import {
  generateMonthGrid,
  getActivityLevel,
  getLogicalDate,
  getLogicalMonthKey,
  getMonthKey,
  toMonthDate,
} from '../utils/activity';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const addMonths = (month, amount) => {
  const date = toMonthDate(month);
  date.setMonth(date.getMonth() + amount);
  return getMonthKey(date);
};

const formatMonth = (month) => toMonthDate(month).toLocaleDateString(undefined, {
  month: 'long',
  year: 'numeric',
});

const formatDay = (date) => date.toLocaleDateString(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const ActivityHeatmap = ({ streak = {}, refreshKey = 0 }) => {
  const { setSelectedDate } = useDate();
  const currentMonth = getLogicalMonthKey();
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState({ loading: true, error: null, result: null });
  const [selectedDay, setSelectedDay] = useState(null);
  const today = getLogicalDate();

  useEffect(() => {
    let cancelled = false;
    setData({ loading: true, error: null, result: null });

    activityService
      .getMonthlyActivity(month)
      .then((result) => {
        if (!cancelled) setData({ loading: false, error: null, result });
      })
      .catch((error) => {
        if (!cancelled) {
          setData({
            loading: false,
            error: error.response?.data?.message || 'Failed to load activity',
            result: null,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [month, refreshKey]);

  const activityByDate = useMemo(
    () => new Map((data.result?.activity || []).map((entry) => [entry.date, entry.count])),
    [data.result],
  );

  const days = useMemo(() => generateMonthGrid(month), [month]);

  const moveMonth = (amount) => {
    const nextMonth = addMonths(month, amount);
    if (nextMonth <= currentMonth) {
      setMonth(nextMonth);
      setSelectedDay(null);
    }
  };

  const selectDay = (date, count, isFuture) => {
    if (!date || isFuture) return;
    const dateKey = `${month}-${String(date.getDate()).padStart(2, '0')}`;
    const day = { date: dateKey, count };
    setSelectedDay(day);
    setSelectedDate(dateKey);
  };

  const totalCompleted = data.result?.totalCompleted ?? 0;
  const activeDays = data.result?.activeDays ?? 0;
  const currentStreak = streak.data?.currentStreak ?? 0;
  const todayCompleted = streak.data?.today?.completed ?? 0;

  return (
    <section className="card activity-card" aria-labelledby="activity-title">
      <div className="activity-heading">
        <div>
          <p className="eyebrow">Productivity</p>
          <h2 id="activity-title">Activity heatmap</h2>
        </div>
        <div className="activity-stats">
          <strong>{totalCompleted}</strong>
          <span>completed</span>
          <strong>{activeDays}</strong>
          <span>active {activeDays === 1 ? 'day' : 'days'}</span>
        </div>
      </div>

      <div className="activity-month-nav">
        <button
          type="button"
          className="icon-btn-light"
          onClick={() => moveMonth(-1)}
          aria-label="Previous month"
          title="Previous month"
        >
          ‹
        </button>
        <span className="activity-month-label">{formatMonth(month)}</span>
        <button
          type="button"
          className="icon-btn-light"
          onClick={() => moveMonth(1)}
          disabled={month >= currentMonth}
          aria-label="Next month"
          title="Next month"
        >
          ›
        </button>
      </div>

      {data.error ? (
        <div className="empty-state compact">{data.error}</div>
      ) : (
        <div className="activity-grid-wrapper">
          <div className="activity-weekdays" aria-hidden="true">
            {WEEKDAYS.map((day) => (
              <span key={day}>{day[0]}</span>
            ))}
          </div>
          <div
            className={`activity-grid ${data.loading ? 'is-loading' : ''}`}
            role="grid"
            aria-label={`Activity grid for ${formatMonth(month)}`}
          >
            {days.map((date, index) => {
              if (!date) {
                return (
                  <span
                    className="activity-cell empty"
                    key={`empty-${index}`}
                    aria-hidden="true"
                  />
                );
              }

              const dateKey = `${month}-${String(date.getDate()).padStart(2, '0')}`;
              const count = activityByDate.get(dateKey) || 0;
              const isFuture = month === currentMonth && dateKey > today;
              const isToday = dateKey === today;
              const level = isFuture ? 0 : getActivityLevel(count);
              const label = `${formatDay(date)}: ${count} ${count === 1 ? 'task' : 'tasks'} completed`;

              return (
                <button
                  type="button"
                  className={`activity-cell level-${level} ${isToday ? 'today' : ''}`}
                  key={dateKey}
                  disabled={isFuture || data.loading}
                  onClick={() => selectDay(date, count, isFuture)}
                  title={label}
                  aria-label={label}
                >
                  <span className="sr-only">{date.getDate()}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="activity-footer">
        <div className="activity-legend" aria-hidden="true">
          <span>Less</span>
          <i className="level-0" title="0 tasks" />
          <i className="level-1" title="1-2 tasks" />
          <i className="level-2" title="3-4 tasks" />
          <i className="level-3" title="5-7 tasks" />
          <i className="level-4" title="8+ tasks" />
          <span>More</span>
        </div>
        <div className="activity-supporting-stats">
          <span>🔥 {streak.loading ? '…' : `${currentStreak} day streak`}</span>
          <span>Today: {streak.loading ? '…' : `${todayCompleted} done`}</span>
        </div>
      </div>

      {selectedDay && (
        <div className="activity-detail" aria-live="polite">
          <strong>{formatDay(new Date(`${selectedDay.date}T12:00:00`))}</strong>
          <span>{selectedDay.count} {selectedDay.count === 1 ? 'task' : 'tasks'} completed</span>
        </div>
      )}
    </section>
  );
};

export default ActivityHeatmap;