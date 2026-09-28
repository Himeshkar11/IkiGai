import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { MoonIcon, SunIcon } from './Icons';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="theme-toggle-icon" aria-hidden="true" style={{ display: 'flex', alignItems: 'center' }}>
        {isDark ? <SunIcon size={14} /> : <MoonIcon size={14} />}
      </span>
      <span className="theme-toggle-text">
        {isDark ? 'Light' : 'Dark'}
      </span>
    </button>
  );
};

export default ThemeToggle;
