import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={`theme-toggle-btn ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="theme-toggle-icon" aria-hidden>
        {isDark ? '☀️' : '🌙'}
      </span>
      <span className="theme-toggle-text">
        {isDark ? 'Light' : 'Dark'}
      </span>
    </button>
  );
};

export default ThemeToggle;
