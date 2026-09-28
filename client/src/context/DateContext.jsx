import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { extractRouteDate, getLogicalToday, parseCalendarDate } from '../utils/activity';

const DateContext = createContext();

export const DateProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const routeDate = location ? extractRouteDate(location.pathname, location.search) : null;
  const [selectedDate, setSelectedDateState] = useState(() => routeDate || getLogicalToday());

  useEffect(() => {
    if (!location) return;
    const rDate = extractRouteDate(location.pathname, location.search);
    if (rDate) {
      setSelectedDateState(rDate);
    } else if (location.pathname === '/' || location.pathname === '/home') {
      setSelectedDateState(getLogicalToday());
    }
  }, [location?.pathname, location?.search]);

  const setSelectedDate = (newDate) => {
    const parsed = parseCalendarDate(newDate) || newDate;
    setSelectedDateState(parsed);
    if (location && navigate) {
      const isDatePage = /^\/(?:tasks|todo|day|home)(\/|$)/i.test(location.pathname) || location.pathname === '/';
      if (isDatePage && parsed) {
        navigate(`/tasks/${parsed}`);
      }
    }
  };

  return (
    <DateContext.Provider value={{ selectedDate, setSelectedDate }}>
      {children}
    </DateContext.Provider>
  );
};

export const useDate = () => {
  const ctx = useContext(DateContext);
  if (!ctx) throw new Error('useDate must be used within DateProvider');
  return ctx;
};

export default DateContext;
