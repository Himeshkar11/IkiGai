import React, { createContext, useContext, useState } from 'react';

const DateContext = createContext();

export const DateProvider = ({ children }) => {
  const today = new Date();
  const isoToday = today.toISOString().slice(0, 10); // YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState(isoToday);

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
