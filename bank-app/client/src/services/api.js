import { API_URL } from '../config/env';

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error('Unable to connect to server. Check that the backend is running.');
  }

  if (res.status === 401) {
    localStorage.removeItem('token');
    // Full page reload clears all React/Zustand state; expired param shows banner
    window.location.href = '/?expired=1';
    return null;
  }

  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.message || `Request failed (${res.status})`);
      err.status = res.status;
      err.data   = data;
      throw err;
    }
    return data;
  }

  if (res.status === 404) {
    throw new Error(`API route not found: ${options.method || 'GET'} ${path}`);
  }
  throw new Error(
    res.ok
      ? 'Unexpected response from server. Please try again.'
      : `Server error (${res.status}). Please try again.`
  );
}

export const api = {
  get:    (path)        => apiFetch(path),
  post:   (path, body)  => apiFetch(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (path, body)  => apiFetch(path, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  (path, body)  => apiFetch(path, {
    method: 'PATCH',
    ...(body != null && { body: JSON.stringify(body) }),
  }),
  delete: (path)        => apiFetch(path, { method: 'DELETE' }),
};
