import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="content-area">{children}</main>
    </div>
  );
};

export default Layout;
