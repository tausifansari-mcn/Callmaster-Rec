import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { cancelSpeech } from '../../utils/speech.js';

/** Scrolls to the requested anchor (or the top) on every navigation, and stops any voice preview. */
export default function ScrollManager() {
  const { pathname, key, state } = useLocation();

  useEffect(() => {
    cancelSpeech();
    const anchor = state?.anchor;
    if (anchor) {
      const timer = setTimeout(() => {
        const el = document.getElementById(anchor);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        else window.scrollTo({ top: 0, behavior: 'auto' });
      }, 60);
      return () => clearTimeout(timer);
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
    return undefined;
  }, [pathname, key, state]);

  return null;
}
