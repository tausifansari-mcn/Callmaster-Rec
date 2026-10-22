/**
 * Raw theme fragments for the Industries hub and the ten industry pages. The theme links industries with
 * {{url:ind-<slug>}} keys; this app serves them at /industries/<slug>, so those are resolved here before the
 * markup reaches ThemeFragment (which resolves the remaining {{img:}} / {{url:}} placeholders).
 */
const RAW = import.meta.glob('../fragments/{industries,ind-*,post-related}.html', { query: '?raw', import: 'default', eager: true });

/** Resolves the theme's {{url:ind-<slug>}} links to this app's /industries/<slug> routes. */
export const resolveIndustryUrls = (html) => html.replace(/\{\{url:ind-([a-z0-9-]+)\}\}/gi, (_, slug) => `/industries/${slug}`);

export const industryFragment = (name) => {
  const html = RAW[`../fragments/${name}.html`];
  return html ? resolveIndustryUrls(html) : null;
};
