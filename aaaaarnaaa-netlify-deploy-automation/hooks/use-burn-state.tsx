'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface BurnStateContextType {
  isBurning: boolean;
  setBurning: (burning: boolean) => void;
  activeBurnCount: number;
  incrementBurnCount: () => void;
  decrementBurnCount: () => void;
}

const BurnStateContext = createContext<BurnStateContextType | undefined>(undefined);

export function BurnStateProvider({ children }: { children: ReactNode }) {
  const [activeBurnCount, setActiveBurnCount] = useState(0);
  const isBurning = activeBurnCount > 0;

  const setBurning = (burning: boolean) => {
    if (burning) {
      setActiveBurnCount(prev => prev + 1);
    } else {
      setActiveBurnCount(prev => Math.max(0, prev - 1));
    }
  };

  const incrementBurnCount = () => {
    setActiveBurnCount(prev => prev + 1);
  };

  const decrementBurnCount = () => {
    setActiveBurnCount(prev => Math.max(0, prev - 1));
  };

  return (
    <BurnStateContext.Provider value={{
      isBurning,
      setBurning,
      activeBurnCount,
      incrementBurnCount,
      decrementBurnCount
    }}>
      {children}
    </BurnStateContext.Provider>
  );
}

export function useBurnState() {
  const context = useContext(BurnStateContext);
  if (context === undefined) {
    throw new Error('useBurnState must be used within a BurnStateProvider');
  }
  return context;
}