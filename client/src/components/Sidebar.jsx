import React, { useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import {
  HomeIcon,
  FoodIcon,
  RoomIcon,
  MoneyIcon,
  UserIcon,
  LogoutIcon,
  PanelLeftIcon,
} from './Icons';

const navItems = [
  { to: '/', label: 'Overview', icon: HomeIcon, id: 'overview' },
  { to: '/food', label: 'Food & Nutrition', icon: FoodIcon, id: 'food' },
  { to: '/room', label: 'Room & Habits', icon: RoomIcon, id: 'room' },
  { to: '/money', label: 'Finances', icon: MoneyIcon, id: 'money' },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const {
    sidebarState,
    toggleSidebar,
    mobileSidebarOpen,
    setMobileSidebarOpen,
  } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef(null);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname, setMobileSidebarOpen]);

  // Focus trap on mobile when drawer is open
  useEffect(() => {
    if (mobileSidebarOpen && sidebarRef.current) {
      const focusableEls = sidebarRef.current.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex="0"]'
      );
      const firstEl = focusableEls[0];
      const lastEl = focusableEls[focusableEls.length - 1];

      firstEl?.focus();

      const handleTabKey = (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === firstEl) {
            e.preventDefault();
            lastEl?.focus();
          } else if (!e.shiftKey && document.activeElement === lastEl) {
            e.preventDefault();
            firstEl?.focus();
          }
        }
      };

      window.addEventListener('keydown', handleTabKey);
      return () => window.removeEventListener('keydown', handleTabKey);
    }
  }, [mobileSidebarOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isRail = sidebarState === 'rail';
  const isHidden = sidebarState === 'hidden';

  return (
    <>
      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        ref={sidebarRef}
        className={`sidebar ${
          isRail ? 'is-rail' : isHidden ? 'is-hidden' : 'is-expanded'
        } ${mobileSidebarOpen ? 'mobile-open' : ''}`}
        aria-label="Sidebar navigation"
      >
        <div className="brand-block">
          <div className="brand-info">
            <div className="brand-mark" aria-hidden="true">
              I
            </div>
            {!isRail && (
              <div className="brand-meta">
                <span className="brand-name">IkiGai</span>
                <span className="brand-sub">Daily Operating System</span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={toggleSidebar}
            title={
              isRail
                ? 'Hide sidebar ([)'
                : isHidden
                ? 'Expand sidebar ([)'
                : 'Collapse to rail ([)'
            }
            aria-label={
              isRail
                ? 'Hide sidebar'
                : isHidden
                ? 'Expand sidebar'
                : 'Collapse sidebar'
            }
          >
            <PanelLeftIcon size={16} />
            {!isRail && <span className="kbd-shortcut-hint">[</span>}
          </button>
        </div>

        <nav className="nav-list" aria-label="Main navigation">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                title={isRail ? item.label : undefined}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'active' : ''} nav-item-${item.id}`
                }
              >
                <span className="nav-icon" aria-hidden="true">
                  <IconComponent size={18} />
                </span>
                {!isRail && <span className="nav-label">{item.label}</span>}
                {isRail && <span className="rail-tooltip">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className={`sidebar-user-block ${isRail ? 'is-rail' : ''}`}>
            {user && (
              <div
                className="user-row"
                title={isRail ? `${user.name} (${user.email || ''})` : undefined}
              >
                <span className="user-avatar" aria-hidden="true">
                  {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={14} />}
                </span>
                {!isRail && (
                  <div className="user-meta">
                    <span className="user-name">{user.name}</span>
                    <span className="user-email">{user.email}</span>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              className={`ghost-btn signout-btn ${isRail ? 'icon-only' : ''}`}
              onClick={handleLogout}
              title="Sign out of your account"
              aria-label="Sign out"
            >
              <LogoutIcon size={14} />
              {!isRail && <span>Sign Out</span>}
              {isRail && <span className="rail-tooltip">Sign Out</span>}
            </button>
          </div>

          {!isRail && (
            <div className="sidebar-legal-links">
              <Link to="/privacy" className="sidebar-legal-link">
                Privacy
              </Link>
              <span className="sidebar-legal-dot" aria-hidden="true">
                ·
              </span>
              <Link to="/terms" className="sidebar-legal-link">
                Terms
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
