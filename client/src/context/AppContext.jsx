import { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { getHealthStatus } from '../services/api';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [healthStatus, setHealthStatus] = useState({ status: 'checking', isError: false, message: '' });
  const [sidebarState, setSidebarStateInternal] = useState(() => {
    try {
      const stored = localStorage.getItem('ikigai-sidebar-state');
      if (stored === 'rail' || stored === 'hidden' || stored === 'expanded') {
        return stored;
      }
      return 'expanded';
    } catch {
      return 'expanded';
    }
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const setSidebarState = useCallback((stateOrFn) => {
    setSidebarStateInternal((prev) => {
      const next = typeof stateOrFn === 'function' ? stateOrFn(prev) : stateOrFn;
      const valid = next === 'rail' || next === 'hidden' ? next : 'expanded';
      try {
        localStorage.setItem('ikigai-sidebar-state', valid);
      } catch {
        // ignore storage errors
      }
      return valid;
    });
  }, []);

  const toggleSidebar = useCallback(() => {
    if (window.innerWidth < 768) {
      setMobileSidebarOpen((prev) => !prev);
    } else {
      setSidebarState((prev) => {
        if (prev === 'expanded') return 'rail';
        if (prev === 'rail') return 'hidden';
        return 'expanded';
      });
    }
  }, [setSidebarState]);

  const runHealthCheck = useCallback(async () => {
    setHealthStatus((prev) => ({ ...prev, status: 'checking' }));
    try {
      const result = await getHealthStatus();
      setHealthStatus({ status: 'ok', isError: false, message: result?.message || 'Operational' });
    } catch (error) {
      setHealthStatus({
        status: 'error',
        isError: true,
        message: error.response?.data?.message || error.message || 'Cannot reach API server',
      });
    }
  }, []);

  // Global keyboard shortcuts: [, Cmd/Ctrl+K, /, Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.isContentEditable);

      // Escape key: close modals or drawers
      if (e.key === 'Escape') {
        if (commandPaletteOpen) {
          setCommandPaletteOpen(false);
          return;
        }
        if (mobileSidebarOpen) {
          setMobileSidebarOpen(false);
          return;
        }
      }

      // Cmd/Ctrl + K: Toggle Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Sidebar shortcut: [
      if (e.key === '[' && !isInput && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Quick search shortcut: /
      if (e.key === '/' && !isInput && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, mobileSidebarOpen, toggleSidebar]);

  const value = useMemo(
    () => ({
      healthStatus,
      setHealthStatus,
      runHealthCheck,
      sidebarState,
      setSidebarState,
      toggleSidebar,
      mobileSidebarOpen,
      setMobileSidebarOpen,
      commandPaletteOpen,
      setCommandPaletteOpen,
    }),
    [
      healthStatus,
      runHealthCheck,
      sidebarState,
      setSidebarState,
      toggleSidebar,
      mobileSidebarOpen,
      commandPaletteOpen,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }

  return context;
};

export default AppContext;
