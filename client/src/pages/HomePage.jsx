const HomePage = () => {
  return (
    <div className="page-card">
      <p className="eyebrow">Overview</p>
      <h1>Home</h1>
      <p>Welcome to IkiGai. This is your personal Life OS dashboard.</p>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Today</span>
          <strong>Daily rhythm</strong>
        </div>
        <div className="stat-card">
          <span>Food</span>
          <strong>Track meals</strong>
        </div>
        <div className="stat-card">
          <span>Room</span>
          <strong>Keep it clean</strong>
        </div>
        <div className="stat-card">
          <span>Money</span>
          <strong>Watch spending</strong>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
