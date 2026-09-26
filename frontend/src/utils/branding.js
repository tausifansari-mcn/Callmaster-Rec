import { API_BASE } from '../api/http.js';

/** URL of the uploaded logo (the query string busts the browser cache when a new logo is uploaded), or '' if none. */
export const logoUrl = (site) => (site?.logoFile ? `${API_BASE}/public/branding/logo?v=${encodeURIComponent(site.logoFile)}` : '');

/** URL of the uploaded home-page hero video (the query string busts the cache on replacement), or '' if none. */
export const heroVideoUrl = (home) => (home?.heroVideoFile ? `${API_BASE}/public/branding/hero-video?v=${encodeURIComponent(home.heroVideoFile)}` : '');
