import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/food', label: 'Food' },
  { to: '/room', label: 'Room' },
  { to: '/money', label: 'Money' },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark">I</div>
        <div>
          <p className="brand-name">IkiGai</p>
          <small>Life OS</small>
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
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div style={styles.userSection}>
        {user && <p style={styles.userName}>👤 {user.name}</p>}
        <button onClick={handleLogout} style={styles.logoutButton}>
          Logout
        </button>
      </div>
    </aside>
  );
};

const styles = {
  userSection: {
    padding: '20px',
    borderTop: '1px solid #eee',
    marginTop: 'auto',
  },
  userName: {
    fontSize: '12px',
    color: '#666',
    margin: '0 0 12px 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  logoutButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
  },
};

export default Sidebar;
