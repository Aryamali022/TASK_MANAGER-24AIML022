// One small helper used by every screen.
// It exists because every protected request needs the same two things:
// the JWT in the Authorization header, and readable error handling.

const SERVER_DOWN = 'Cannot reach the server. Is the backend running on port 5000?';

// url    - e.g. '/tasks'  (Vite forwards it to localhost:5000)
// method - 'GET' | 'POST' | 'PUT' | 'DELETE'
// body   - a plain object, it gets JSON-encoded for you
// token  - the JWT from login; when present it is sent as "Bearer <token>"
export async function api(url, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(SERVER_DOWN); // server not running at all
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(SERVER_DOWN); // server replied, but not with JSON
  }

  if (!res.ok) {
    // Carry the status code so the caller can react to 401 (token expired).
    const error = new Error(data.message || 'Request failed');
    error.status = res.status;
    throw error;
  }

  return data;
}
