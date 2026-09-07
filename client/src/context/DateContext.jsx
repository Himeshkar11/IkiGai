import React, { createContext, useContext, useState } from 'react';
import { getLogicalToday } from '../utils/activity';

const DateContext = createContext();

export const DateProvider = ({ children }) => {
  const [selectedDate, setSelectedDate] = useState(getLogicalToday());

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
