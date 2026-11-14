'use client';
import { useState, useEffect } from 'react';

export function useLiveDeskState() {
  const [state, setState] = useState({
    status: 'online',
    activeLeads: 4,
    emergencyQueue: 0,
    systemHealth: 'optimal',
    lastSync: new Date().toISOString()
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setState(s => ({ ...s, lastSync: new Date().toISOString() }));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return {
    state,
    setState,
    refresh: () => setState(s => ({ ...s, lastSync: new Date().toISOString() }))
  };
}
export default useLiveDeskState;