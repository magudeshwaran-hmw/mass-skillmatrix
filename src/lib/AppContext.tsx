import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppData, loadAppData } from './appStore';

interface AppContextType {
  data: AppData | null;
  isLoading: boolean;
  reload: () => Promise<void>;
}

export const AppContext = createContext<AppContextType>({
  data: null, isLoading: true, reload: async () => {},
});

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData]       = useState<AppData | null>(null);
  const [isLoading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const result = await loadAppData();
    setData(result);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Re-load when session changes (login / logout)
  useEffect(() => {
    const handler = () => load();
    window.addEventListener('skill_nav_session_changed', handler);
    return () => window.removeEventListener('skill_nav_session_changed', handler);
  }, []);

  return (
    <AppContext.Provider value={{ data, isLoading, reload: load }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
