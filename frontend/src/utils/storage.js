export const safeGet = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
export const safeSet = (key, val) => { try { localStorage.setItem(key, val); } catch { /* storage unavailable */ } };
export const safeRemove = (key) => { try { localStorage.removeItem(key); } catch { /* storage unavailable */ } };
