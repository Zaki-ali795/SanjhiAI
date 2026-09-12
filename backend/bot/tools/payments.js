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

export async function getMyPayments(jwt) {
  return apiCall('GET', '/api/payments/my', jwt);
}

export async function submitMyPayment(jwt, committeeId, cycleId, senderDetails) {
  return apiCall('POST', `/api/committees/${committeeId}/cycles/${cycleId}/payments`, jwt, {
    sender_account_details: senderDetails,
  });
}
