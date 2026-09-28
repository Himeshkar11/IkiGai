import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import { AppProvider, useAppContext } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DateProvider } from './context/DateContext';
import { ThemeProvider } from './context/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import useHealthCheck from './hooks/useHealthCheck';
import FoodPage from './pages/FoodPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MoneyPage from './pages/MoneyPage';
import NotFoundPage from './pages/NotFoundPage';
import RoomPage from './pages/RoomPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import { formatStatus } from './utils/format';
import './App.css';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-screen"><div className="loading-spinner" /><p>Loading Life OS…</p></div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

// Redirect authenticated users away from auth pages
const AuthRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen"><div className="loading-spinner" /><p>Loading Life OS…</p></div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppShell = () => {
  const location = useLocation();
  const { healthStatus } = useAppContext();
  const { isAuthenticated, loading } = useAuth();

  useHealthCheck();

  // Don't show main layout for login/register
  if (loading) {
    return (
      <div className="loading-screen"><div className="loading-spinner" /><p>Loading Life OS…</p></div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route
          path="/login"
          element={
            <AuthRoute>
              <LoginPage />
            </AuthRoute>
          }
        />
        <Route
          path="/register"
          element={
            <AuthRoute>
              <RegisterPage />
            </AuthRoute>
          }
        />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const isHealthy = healthStatus?.status?.toLowerCase() === 'ok';
  const statusText = isHealthy
    ? `API ${formatStatus(healthStatus.status)}`
    : `API ${formatStatus(healthStatus?.status || 'checking')}`;

  const getHeaderTitle = () => {
    const p = location.pathname;
    if (p === '/' || p === '/home') return 'Today';
    if (p === '/privacy') return 'Privacy Policy';
    if (p === '/terms') return 'Terms & Conditions';
    return p.slice(1).replace(/-/g, ' ');
  };

  return (
    <Layout>
      <header className="topbar">
        <div className="topbar-left">
          <p className="topbar-title">{getHeaderTitle()}</p>
        </div>
        <div className="topbar-right">
          <ThemeToggle />
          <div
            className={`status-pill ${isHealthy ? 'online' : 'offline'}`}
            title={statusText}
          >
            {isHealthy ? 'API • OK' : 'API • Issue'}
          </div>
        </div>
      </header>

      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        {/* alias for legacy or external redirects that expect /home */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks/:date"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/todo/:date"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/day/:date"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/home/:date"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/food"
          element={
            <ProtectedRoute>
              <FoodPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/room"
          element={
            <ProtectedRoute>
              <RoomPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/money"
          element={
            <ProtectedRoute>
              <MoneyPage />
            </ProtectedRoute>
          }
        />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/not-found" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/not-found" replace />} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <AppProvider>
            <DateProvider>
              <AppShell />
            </DateProvider>
          </AppProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
