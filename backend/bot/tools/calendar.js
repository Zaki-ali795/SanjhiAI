import { generateGoogleCalendarUrl } from '../../utilities/calendarGenerator.js';

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

export async function getCalendarReminderLink(jwt, committeeId = null) {
  // Fetch user's payments & committees
  const res = await apiCall('GET', '/api/payments/my', jwt);
  if (!res.success) return res;

  const paymentsData = res.data?.payments || res.data || [];
  let targetPayment = null;

  if (committeeId) {
    targetPayment = paymentsData.find(p => p.committee_id === committeeId);
  } else {
    // Pick the first upcoming due payment
    targetPayment = paymentsData.find(p => p.payment_status !== 'verified' && p.due_date);
  }

  if (!targetPayment) {
    return {
      success: true,
      data: {
        message: 'No upcoming payment dues found for your committees right now.',
      },
    };
  }

  const title = `Sanjhi Payment Due: ${targetPayment.committee_name || 'Savings Pool'}`;
  const amountStr = targetPayment.amount ? `Rs. ${Number(targetPayment.amount).toLocaleString('en-PK')}` : '';
  const description = `Contribution of ${amountStr} is due for ${targetPayment.committee_name || 'your committee'}. Submit receipt on Sanjhi AI to maintain your Trust Score.`;
  const startDate = targetPayment.due_date ? new Date(targetPayment.due_date) : new Date();

  const googleUrl = generateGoogleCalendarUrl({
    title,
    description,
    startDate,
    location: 'Sanjhi AI Platform',
  });

  return {
    success: true,
    data: {
      committee_name: targetPayment.committee_name,
      due_date: targetPayment.due_date,
      amount: targetPayment.amount,
      google_calendar_url: googleUrl,
      instructions: 'Click the 1-click Google Calendar link to add the payment reminder to your calendar app.',
    },
  };
}
