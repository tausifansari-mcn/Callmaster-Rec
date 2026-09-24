import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { publicApi } from '../api/public.js';

const SiteContext = createContext(null);

/** Loads the admin-managed site configuration (pricing, copy, FAQs, chatbot…) once per page load. */
export function SiteProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', config: null, error: '' });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading', error: '' }));
    try {
      setState({ status: 'ready', config: await publicApi.config(), error: '' });
    } catch (err) {
      setState({ status: 'error', config: null, error: err.message });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const value = useMemo(() => ({ ...state, reload: load }), [state, load]);
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSiteState() {
  return useContext(SiteContext);
}

/** Only call inside components rendered after the config has loaded (SiteLayout guarantees this). */
export function useSite() {
  const { config } = useContext(SiteContext);
  return config;
}
