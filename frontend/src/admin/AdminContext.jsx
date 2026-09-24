import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { adminApi, tokenStore } from '../api/admin.js';

const AuthContext = createContext(null);
const ToastContext = createContext(null);

export function AdminProviders({ children }) {
  return (
    <ToastProvider>
      <AuthProvider>{children}</AuthProvider>
    </ToastProvider>
  );
}

// ---------------------------------------------------------------- auth
function AuthProvider({ children }) {
  const [state, setState] = useState({ status: tokenStore.get() ? 'checking' : 'anon', admin: null });

  useEffect(() => {
    if (!tokenStore.get()) return undefined;
    let alive = true;
    adminApi.me()
      .then((r) => alive && setState({ status: 'authed', admin: r.admin }))
      .catch(() => alive && setState({ status: 'anon', admin: null }));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const onExpired = () => setState({ status: 'anon', admin: null });
    window.addEventListener('admin-unauthorized', onExpired);
    return () => window.removeEventListener('admin-unauthorized', onExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    const r = await adminApi.login(email, password);
    tokenStore.set(r.token);
    setState({ status: 'authed', admin: r.admin });
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setState({ status: 'anon', admin: null });
  }, []);

  const value = useMemo(() => ({ ...state, login, logout }), [state, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);

// ---------------------------------------------------------------- toasts
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const push = useCallback((message, kind = 'ok') => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 6000 : 3000);
  }, []);

  const api = useMemo(() => ({ success: (m) => push(m, 'ok'), error: (m) => push(m, 'error') }), [push]);
  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="adm-toasts" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className={`adm-toast ${t.kind}`}>{t.message}</div>)}
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
