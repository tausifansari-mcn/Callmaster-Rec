export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/**
 * Thin fetch wrapper. Sends JSON (or FormData untouched), parses JSON replies, and turns the API's
 * `{ error: { message, details } }` shape into a thrown ApiError with a user-presentable message.
 */
export async function request(method, path, { body, token, query, raw } = {}) {
  const headers = {};
  let payload;
  if (body instanceof FormData) payload = body;
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  let url = `${API_BASE}${path}`;
  if (query) {
    const qs = new URLSearchParams(Object.entries(query).filter(([, v]) => v !== '' && v !== undefined && v !== null));
    if ([...qs].length) url += `?${qs}`;
  }

  let res;
  try {
    res = await fetch(url, { method, headers, body: payload });
  } catch {
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0);
  }
  if (raw) {
    if (!res.ok) await throwFrom(res);
    return res;
  }
  if (!res.ok) await throwFrom(res);
  if (res.status === 204) return null;
  return res.json();
}

async function throwFrom(res) {
  let data;
  try { data = await res.json(); } catch { /* not JSON */ }
  const message = data?.error?.message || `Request failed (${res.status})`;
  throw new ApiError(message, res.status, data?.error?.details);
}
