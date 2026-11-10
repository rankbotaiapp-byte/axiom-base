'use client';

import { createContext, useContext, useState } from 'react';
import type { ServiceKey } from './config/site';

export type LockedEstimate = {
  summary: string;
  service: ServiceKey;
  acres: number;
};

type Ctx = {
  locked: LockedEstimate | null;
  lock: (e: LockedEstimate) => void;
  clear: () => void;
};

const EstimateContext = createContext<Ctx | null>(null);

export function EstimateProvider({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState<LockedEstimate | null>(null);
  return (
    <EstimateContext.Provider value={{ locked, lock: setLocked, clear: () => setLocked(null) }}>
      {children}
    </EstimateContext.Provider>
  );
}

export function useEstimate() {
  const ctx = useContext(EstimateContext);
  if (!ctx) throw new Error('useEstimate must be used inside <EstimateProvider>');
  return ctx;
}
