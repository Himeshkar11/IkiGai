import React from 'react';

const StreakCard = ({ streak }) => {
  if (streak.loading) {
    return <section className="card streak-card">Loading streak...</section>;
  }

  if (streak.error) {
    return (
      <section className="card streak-card">
        <div className="home-module-head">
          <h4>Todo streak</h4>
        </div>
        <p className="muted">{streak.error}</p>
      </section>
    );
  }

  const data = streak.data;
  const today = data?.today || { total: 0, completed: 0, isComplete: false };
  const progress = today.total ? Math.round((today.completed / today.total) * 100) : 0;

  return (
    <section className="card streak-card">
      <div className="home-module-head">
        <h4>Todo streak</h4>
        <span className="streak-icon" aria-hidden>🔥</span>
      </div>
      <div className="streak-value">{data?.currentStreak ?? 0}</div>
      <div className="overview-label">DAY STREAK</div>
      <div className="streak-best">Best: {data?.longestStreak ?? 0} days</div>
      <div className="streak-progress-label">
        <span>Today&apos;s progress</span>
        <strong>{today.completed} / {today.total}</strong>
      </div>
      <div className="progress-bar" aria-label={`${progress}% of today's todos completed`}>
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      {!today.total && <p className="muted streak-note">Add a Todo to start today&apos;s streak.</p>}
      {today.total > 0 && !today.isComplete && (
        <p className="muted streak-note">Complete every Todo to extend the streak.</p>
      )}
    </section>
  );
};

export default StreakCard;