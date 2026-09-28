import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import {
  HomeIcon,
  FoodIcon,
  RoomIcon,
  MoneyIcon,
  UserIcon,
  LogoutIcon,
} from './Icons';

const navItems = [
  { to: '/', label: 'Overview', icon: HomeIcon },
  { to: '/food', label: 'Food & Nutrition', icon: FoodIcon },
  { to: '/room', label: 'Room & Habits', icon: RoomIcon },
  { to: '/money', label: 'Finances', icon: MoneyIcon },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar" aria-label="Sidebar navigation">
      <div className="brand-block">
        <div className="brand-mark" aria-hidden="true">I</div>
        <div className="brand-meta">
          <span className="brand-name">IkiGai</span>
          <span className="brand-sub">Daily Operating System</span>
        </div>
      </div>

      <nav className="nav-list" aria-label="Main navigation">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                isActive ? 'nav-item active' : 'nav-item'
              }
            >
              <span className="nav-icon" aria-hidden="true">
                <IconComponent size={18} />
              </span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user-block">
          {user && (
            <div className="user-row" title={user.email || user.name}>
              <span className="user-avatar" aria-hidden="true">
                <UserIcon size={14} />
              </span>
              <span className="user-name">{user.name}</span>
            </div>
          )}

          <div className="footer-actions">
            <ThemeToggle className="sidebar-theme-toggle" />
            <button
              type="button"
              className="ghost-btn"
              onClick={handleLogout}
              title="Sign out of your account"
              aria-label="Sign out"
            >
              <LogoutIcon size={13} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
              Sign Out
            </button>
          </div>
        </div>

        <div className="sidebar-legal-links">
          <Link to="/privacy" className="sidebar-legal-link">Privacy</Link>
          <span className="sidebar-legal-dot" aria-hidden="true">·</span>
          <Link to="/terms" className="sidebar-legal-link">Terms</Link>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
