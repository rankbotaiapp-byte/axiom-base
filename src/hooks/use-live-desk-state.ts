"use client";

import { useCallback, useEffect, useState } from "react";

export type LiveDeskState = {
  status: string;
  activeLeads: number;
  emergencyQueue: number;
  systemHealth: string;
  lastSync: string;
  paused: boolean;
  caps: number;
  sentToday: number;
};

const INITIAL: LiveDeskState = {
  status: "online",
  activeLeads: 4,
  emergencyQueue: 0,
  systemHealth: "optimal",
  lastSync: new Date().toISOString(),
  paused: false,
  caps: 120,
  sentToday: 18,
};

export function useLiveDeskState(_shopSlug?: string) {
  const [state, setState] = useState<LiveDeskState>(INITIAL);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setState((s) => ({ ...s, lastSync: new Date().toISOString() }));
    setUpdatedAt(new Date().toISOString());
    setError(null);
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [refresh]);

  return {
    state,
    setState,
    updatedAt,
    error,
    refresh,
  };
}

export default useLiveDeskState;
