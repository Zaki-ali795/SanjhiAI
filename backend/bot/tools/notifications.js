const BASE = `http://127.0.0.1:${process.env.PORT || 3000}`;

async function apiCall(method, path, jwt) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
  });
  if (res.status === 401) return { success: false, error: 'SESSION_EXPIRED', status: 401 };
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { success: false, error: data.error || `HTTP ${res.status}`, status: res.status };
  return { success: true, data, status: res.status };
}

export async function getNotifications(jwt) {
  return apiCall('GET', '/api/notifications', jwt);
}
