const BASE = `http://127.0.0.1:${process.env.PORT || 3000}`;

async function apiCall(method, path, jwt, body = null) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  if (res.status === 401) return { success: false, error: 'SESSION_EXPIRED', status: 401 };
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { success: false, error: data.error || `HTTP ${res.status}`, status: res.status };
  return { success: true, data, status: res.status };
}

export async function listMyCommittees(jwt) {
  return apiCall('GET', '/api/committees', jwt);
}

export async function getCommitteeDetail(jwt, committeeId) {
  return apiCall('GET', `/api/committees/${committeeId}`, jwt);
}

export async function createCommittee(jwt, params) {
  return apiCall('POST', '/api/committees', jwt, params);
}

export async function joinCommitteeByCode(jwt, inviteCode) {
  return apiCall('POST', '/api/committees/join', jwt, { invite_code: inviteCode });
}
