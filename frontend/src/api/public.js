import { request } from './http.js';

export const publicApi = {
  config: () => request('GET', '/public/config'),
  page: (slug) => request('GET', `/public/pages/${encodeURIComponent(slug)}`),
  contact: (body) => request('POST', '/public/contact', { body }),
  lead: (body) => request('POST', '/public/leads', { body }),

  sendOtp: (body) => request('POST', '/otp/send', { body }),
  verifyOtp: (body) => request('POST', '/otp/verify', { body }),

  // Insights wizard: step 1 saves the visitor, step 2 attaches the recording to that same record
  auditRegister: (body) => request('POST', '/demos/audit/register', { body }),
  auditSubmit: (id, formData) => request('POST', `/demos/audit/${id}/submit`, { body: formData }),
  auditStatus: (id, token) => request('GET', `/demos/audit/${id}`, { query: { token } }),
  voiceRegister: (body) => request('POST', '/demos/voice/register', { body }),
  voiceDemo: (body) => request('POST', '/demos/voice', { body }),

  quote: (body) => request('POST', '/checkout/quote', { body }),
  createOrder: (payload, scopeFile) => {
    const form = new FormData();
    form.append('payload', JSON.stringify(payload));
    if (scopeFile) form.append('scopeOfWork', scopeFile);
    return request('POST', '/orders', { body: form });
  },
  sandboxPay: (orderId, accessToken) => request('POST', `/orders/${orderId}/sandbox-pay`, { body: { accessToken } }),
  verifyRazorpay: (orderId, body) => request('POST', `/orders/${orderId}/verify`, { body }),
};
