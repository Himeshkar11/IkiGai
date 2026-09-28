import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="content-wrapper">
        <main className="content-area">{children}</main>
        <footer className="app-footer" aria-label="Application footer">
          <div className="app-footer-left">
            <span>© {new Date().getFullYear()} IkiGai. All rights reserved.</span>
          </div>
          <div className="app-footer-right">
            <Link to="/privacy" className="footer-link">Privacy Policy</Link>
            <span className="footer-dot" aria-hidden="true">·</span>
            <Link to="/terms" className="footer-link">Terms of Service</Link>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
