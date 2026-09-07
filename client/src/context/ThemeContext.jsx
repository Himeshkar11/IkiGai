import React, { createContext, useContext, useEffect, useState } from 'react';
import { applyThemeToDocument, getNextTheme, getStoredTheme, THEME_STORAGE_KEY } from '../utils/theme';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children, initialTheme }) => {
  const [theme, setThemeState] = useState(() => initialTheme || getStoredTheme());

  useEffect(() => {
    applyThemeToDocument(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore storage error
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => getNextTheme(prev));
  };

  const setTheme = (nextTheme) => {
    if (nextTheme === 'dark' || nextTheme === 'light') {
      setThemeState(nextTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
