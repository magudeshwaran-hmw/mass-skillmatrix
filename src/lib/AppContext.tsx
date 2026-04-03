import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppData, loadAppData } from './appStore';
import LoadingOverlay from '../components/LoadingOverlay';

interface AppContextType {
  data: AppData | null;
  isLoading: boolean;
  setGlobalLoading: (val: boolean | string | null) => void;
  reload: () => Promise<void>;
  isPopup?: boolean;
  onTabChange?: (tab: string) => void;
}

export const AppContext = createContext<AppContextType>({
  data: null, isLoading: true, setGlobalLoading: () => {}, reload: async () => {}, isPopup: false
});

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData]       = useState<AppData | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Syncing data...');

  const setGlobalLoading = (val: boolean | string | null) => {
    if (typeof val === 'string') {
      setLoadingText(val);
      setLoading(true);
    } else {
      setLoading(!!val);
      if (val === true) setLoadingText('Syncing data...');
    }
  };

  const load = async () => {
    setGlobalLoading('Synchronizing Zensar Cloud...');
    const result = await loadAppData();
    setData(result);
    setGlobalLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Re-load when session changes (login / logout)
  useEffect(() => {
    const handler = () => load();
    window.addEventListener('skill_nav_session_changed', handler);
    return () => window.removeEventListener('skill_nav_session_changed', handler);
  }, []);

  return (
    <AppContext.Provider value={{ data, isLoading, setGlobalLoading, reload: load, isPopup: false }}>
      <LoadingOverlay active={isLoading} text={loadingText} />
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
