import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/food', label: 'Food' },
  { to: '/room', label: 'Room' },
  { to: '/money', label: 'Money' },
];

const Sidebar = () => {
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
    </aside>
  );
};

export default Sidebar;
