const BASE = '/api';

async function apiFetch(path, options = {}) {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let res;
  try {
    res = await fetch(`${BASE}${path}`, { ...options, headers });
  } catch {
    throw new Error('Unable to connect to server. Is the backend running?');
  }

  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    throw new Error(
      res.ok ? 'Unexpected server response.' : `Server error (${res.status}).`
    );
  }

  const data = await res.json();

  if (res.status === 401) {
    // Clear any stale credentials — but do NOT force a page reload.
    // For login attempts this IS the error (wrong password).
    // For protected endpoints the admin layout will redirect on next render.
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
    }
    throw new Error(data.message || 'Invalid credentials.');
  }

  if (!res.ok) throw new Error(data.message || 'Something went wrong.');
  return data;
}

export const api = {
  get:    (path)        => apiFetch(path),
  post:   (path, body)  => apiFetch(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (path, body)  => apiFetch(path, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  (path, body)  => apiFetch(path, {
    method: 'PATCH',
    ...(body != null ? { body: JSON.stringify(body) } : {}),
  }),
  delete: (path)        => apiFetch(path, { method: 'DELETE' }),
};
