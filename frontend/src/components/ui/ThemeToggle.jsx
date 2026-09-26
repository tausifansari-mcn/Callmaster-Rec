import { useEffect, useState } from 'react';

const KEY = 'cm-theme';
const current = () => (document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

/** Sun / moon button: flips the whole site (and admin panel) between the light and dark theme and remembers the choice. */
export default function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState(current);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(KEY, theme); } catch { /* storage unavailable — the choice just isn't remembered */ }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0A0C11' : '#FFFFFF');
  }, [theme]);

  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button type="button" className={`theme-toggle ${className}`} onClick={() => setTheme(next)} aria-label={`Switch to ${next} mode`} title={`Switch to ${next} mode`}>
      <svg className="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
      <svg className="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
    </button>
  );
}
