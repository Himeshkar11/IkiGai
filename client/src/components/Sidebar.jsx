import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const navItems = [
  { to: '/', label: 'Home', icon: '⌂' },
  { to: '/food', label: 'Food', icon: '🍎' },
  { to: '/room', label: 'Room', icon: '🏠' },
  { to: '/money', label: 'Money', icon: '₹' },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="brand-block compact">
        <div className="brand-mark">I</div>
        <div className="brand-meta">
          <p className="brand-name">IkiGai</p>
          <small className="brand-sub">Life OS</small>
        </div>
      </div>

      <nav className="nav-list" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              isActive ? 'nav-item active' : 'nav-item'
            }
          >
            <span className="nav-icon" aria-hidden>
              {item.icon}
            </span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {user && <div className="user-row"> <span className="user-emoji">👤</span> <span className="user-name">{user.name}</span> </div>}
        <div className="footer-actions">
          <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}><span className="theme-toggle-icon">{theme === 'dark' ? '☀️' : '🌙'}</span><span>{theme === 'dark' ? 'Light' : 'Dark'}</span></button>
          <button className="ghost-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
