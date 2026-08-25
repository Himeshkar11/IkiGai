import { createContext, useContext, useMemo, useState } from 'react';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [healthStatus, setHealthStatus] = useState({ status: 'checking' });

  const value = useMemo(
    () => ({
      healthStatus,
      setHealthStatus,
    }),
    [healthStatus],
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
