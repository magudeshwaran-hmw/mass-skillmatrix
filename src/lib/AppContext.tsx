import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  const [data, setData]         = useState<AppData | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Syncing data...');
  const [serverDown, setServerDown]   = useState(false);
  const [retryCount, setRetryCount]   = useState(0);

  const setGlobalLoading = (val: boolean | string | null) => {
    if (typeof val === 'string') {
      setLoadingText(val);
      setLoading(true);
    } else {
      setLoading(!!val);
      if (val === true) setLoadingText('Syncing data...');
    }
  };

  const load = useCallback(async () => {
    setGlobalLoading('Synchronizing Zensar Cloud...');
    try {
      const result = await loadAppData();
      setData(result);
      setServerDown(false);
    } catch (err) {
      console.warn('[AppContext] Server unreachable, will retry...');
      setServerDown(true);
    } finally {
      setGlobalLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  // Auto-retry every 5s when server is down
  useEffect(() => {
    if (!serverDown) return;
    const t = setTimeout(() => {
      setRetryCount(c => c + 1);
      load();
    }, 5000);
    return () => clearTimeout(t);
  }, [serverDown, retryCount]);

  // Re-load when session changes (login / logout)
  useEffect(() => {
    const handler = () => load();
    window.addEventListener('skill_nav_session_changed', handler);
    return () => window.removeEventListener('skill_nav_session_changed', handler);
  }, [load]);

  return (
    <AppContext.Provider value={{ data, isLoading, setGlobalLoading, reload: load, isPopup: false }}>
      <LoadingOverlay active={isLoading} text={loadingText} />
      {/* Server down banner */}
      {serverDown && !isLoading && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9998,
          background: '#EF4444', color: '#fff', textAlign: 'center',
          padding: '10px 16px', fontSize: 13, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12
        }}>
          ⚠️ Server not reachable — please start the server (node server-postgres.cjs) · Retrying automatically...
          <button onClick={load} style={{ padding: '4px 14px', borderRadius: 8, background: '#fff', color: '#EF4444', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 12 }}>
            Retry Now
          </button>
        </div>
      )}
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
