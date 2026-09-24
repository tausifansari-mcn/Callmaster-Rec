import { request } from './http.js';

const TOKEN_KEY = 'cm_admin_token';
export const tokenStore = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } },
  set: (t) => { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* storage unavailable */ } },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ } },
};

async function call(method, path, opts = {}) {
  try {
    return await request(method, `/admin${path}`, { ...opts, token: tokenStore.get() });
  } catch (err) {
    // An expired/revoked session anywhere in the panel sends the user back to the login screen.
    if (err.status === 401 && !path.startsWith('/auth/login')) {
      tokenStore.clear();
      window.dispatchEvent(new Event('admin-unauthorized'));
    }
    throw err;
  }
}

async function saveResponse(res, fallbackName) {
  const disposition = res.headers.get('Content-Disposition') || '';
  const name = /filename="?([^";]+)"?/.exec(disposition)?.[1] || fallbackName;
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export const adminApi = {
  login: (email, password) => call('POST', '/auth/login', { body: { email, password } }),
  me: () => call('GET', '/auth/me'),
  changePassword: (currentPassword, newPassword) => call('POST', '/auth/change-password', { body: { currentPassword, newPassword } }),
  stats: () => call('GET', '/stats'),

  // orders | leads | contacts | demos
  list: (resource, query) => call('GET', `/${resource}`, { query }),
  get: (resource, id) => call('GET', `/${resource}/${id}`),
  update: (resource, id, body) => call('PATCH', `/${resource}/${id}`, { body }),
  remove: (resource, id) => call('DELETE', `/${resource}/${id}`),
  exportCsv: async (resource, query) => saveResponse(await call('GET', `/${resource}/export.csv`, { query, raw: true }), `${resource}.csv`),
  downloadFile: async (kind, storedName, saveAs) => {
    const res = await call('GET', `/files/${kind}/${encodeURIComponent(storedName)}`, { raw: true });
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement('a');
    a.href = url; a.download = saveAs || storedName;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  },

  testEmail: (to) => call('POST', '/email/test', { body: { to } }),
  replyContact: (id, subject, message) => call('POST', `/contacts/${id}/reply`, { body: { subject, message } }),

  settings: () => call('GET', '/settings'),
  saveSetting: (key, value) => call('PUT', `/settings/${key}`, { body: value }),
  resetSetting: (key) => call('POST', `/settings/${key}/reset`),

  pages: () => call('GET', '/pages'),
  page: (id) => call('GET', `/pages/${id}`),
  createPage: (body) => call('POST', '/pages', { body }),
  updatePage: (id, body) => call('PUT', `/pages/${id}`, { body }),
  deletePage: (id) => call('DELETE', `/pages/${id}`),

  promos: () => call('GET', '/promos'),
  createPromo: (body) => call('POST', '/promos', { body }),
  updatePromo: (id, body) => call('PUT', `/promos/${id}`, { body }),
  deletePromo: (id) => call('DELETE', `/promos/${id}`),

  users: () => call('GET', '/users'),
  createUser: (body) => call('POST', '/users', { body }),
  updateUser: (id, body) => call('PUT', `/users/${id}`, { body }),
  deleteUser: (id) => call('DELETE', `/users/${id}`),
};
