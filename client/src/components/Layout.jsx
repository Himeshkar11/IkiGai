import React from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import CommandPalette from './CommandPalette';
import { useAppContext } from '../context/AppContext';
import { PanelLeftIcon } from './Icons';

const Layout = ({ children }) => {
  const { sidebarState, toggleSidebar } = useAppContext();
  const isRail = sidebarState === 'rail';
  const isHidden = sidebarState === 'hidden';

  return (
    <div
      className={`app-shell ${
        isRail ? 'shell-rail' : isHidden ? 'shell-hidden' : 'shell-expanded'
      }`}
    >
      <Sidebar />

      {isHidden && (
        <>
          <div
            className="sidebar-edge-hover-zone"
            onClick={toggleSidebar}
            title="Click or press [ to show sidebar"
            aria-hidden="true"
          />
          <button
            type="button"
            className="sidebar-edge-handle"
            onClick={toggleSidebar}
            title="Expand sidebar ([)"
            aria-label="Expand sidebar"
          >
            <PanelLeftIcon size={14} />
            <span>Sidebar</span>
            <span className="edge-kbd">[</span>
          </button>
        </>
      )}

      <div className="content-wrapper">
        <main className="content-area">{children}</main>
        <footer className="app-footer" aria-label="Application footer">
          <div className="app-footer-left">
            <span>© {new Date().getFullYear()} IkiGai · Personal Life OS</span>
          </div>
          <div className="app-footer-right">
            <Link to="/privacy" className="footer-link">Privacy</Link>
            <span className="footer-dot" aria-hidden="true">·</span>
            <Link to="/terms" className="footer-link">Terms</Link>
          </div>
        </footer>
      </div>
      <CommandPalette />
    </div>
  );
};

export default Layout;
