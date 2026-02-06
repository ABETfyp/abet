import React, { createContext, useContext, useState } from 'react';

const CycleContext = createContext();

export const useCycle = () => {
  const context = useContext(CycleContext);
  if (!context) {
    throw new Error('useCycle must be used within CycleProvider');
  }
  return context;
};

export const CycleProvider = ({ children }) => {
  const [currentCycleId, setCurrentCycleId] = useState(null);
  
  return (
    <CycleContext.Provider value={{ currentCycleId, setCurrentCycleId }}>
      {children}
    </CycleContext.Provider>
  );
};