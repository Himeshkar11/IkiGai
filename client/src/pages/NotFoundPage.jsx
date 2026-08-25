import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="page-card">
      <p className="eyebrow">404</p>
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link to="/" className="primary-link">
        Return home
      </Link>
    </div>
  );
};

export default NotFoundPage;
