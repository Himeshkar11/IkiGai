export const THEME_STORAGE_KEY = 'ikigai-theme';

export const getStoredTheme = () => {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    // ignore access errors
  }
  return 'light';
};

export const applyThemeToDocument = (theme) => {
  if (typeof document !== 'undefined' && document.documentElement) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }
};

export const getNextTheme = (currentTheme) => {
  return currentTheme === 'dark' ? 'light' : 'dark';
};
