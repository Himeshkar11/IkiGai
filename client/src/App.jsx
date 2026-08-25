import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { AppProvider, useAppContext } from './context/AppContext';
import useHealthCheck from './hooks/useHealthCheck';
import FoodPage from './pages/FoodPage';
import HomePage from './pages/HomePage';
import MoneyPage from './pages/MoneyPage';
import NotFoundPage from './pages/NotFoundPage';
import RoomPage from './pages/RoomPage';
import { formatStatus } from './utils/format';
import './App.css';

const AppShell = () => {
  const { healthStatus } = useAppContext();

  useHealthCheck();

  const statusText =
    healthStatus?.status === 'ok'
      ? `API ${formatStatus(healthStatus.status)}`
      : `API ${formatStatus(healthStatus?.status || 'checking')}`;

  return (
    <Layout>
      <header className="topbar">
        <div>
          <p className="eyebrow">System status</p>
          <h2>IkiGai</h2>
        </div>

        <div
          className={`status-pill ${healthStatus?.status === 'ok' ? 'online' : 'offline'}`}
        >
          {statusText}
        </div>
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/food" element={<FoodPage />} />
        <Route path="/room" element={<RoomPage />} />
        <Route path="/money" element={<MoneyPage />} />
        <Route path="/not-found" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/not-found" replace />} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <AppProvider>
      <Router>
        <AppShell />
      </Router>
    </AppProvider>
  );
}

export default App;
