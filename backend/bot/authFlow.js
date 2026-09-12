import { createSession, updateSession, incrementOtpAttempts, deleteSession } from './sessionManager.js';

const BASE = `http://127.0.0.1:${process.env.PORT || 3000}`;

const WELCOME_MSG = `🙏 *Sanjhi میں خوش آمدید!*
Welcome to *Sanjhi* — Pakistan's trusted committee savings platform.

آپ کیا کرنا چاہتے ہیں؟ / What would you like to do?

1️⃣ *لاگ ان* / Login
2️⃣ *نیا اکاؤنٹ بنائیں* / Sign Up

_Reply with 1 or 2_`;

const OTP_PROMPT = (phone) => `🔐 آپ کا OTP بھیج دیا گیا ہے۔
Your OTP has been sent to *${phone}*

6 ہندسوں کا کوڈ یہاں لکھیں:
Please enter the 6-digit code:

_Valid for 10 minutes. Type "resend" to get a new code._`;

const SUCCESS_MSG = (userName) => `✅ *${userName}، خوش آمدید!*
Welcome back, *${userName}*!

آپ کیا کرنا چاہتے ہیں؟ / What would you like to do?
• میری کمیٹیاں / My committees
• ڈیش بورڈ / Dashboard
• ادائیگی / Payments
• شکایت / File complaint`;

function normalizePhone(raw) {
  let digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('03') && digits.length === 11) digits = '92' + digits.slice(1);
  if (!digits.startsWith('92') && digits.length === 10) digits = '92' + digits;
  if (digits.length < 11 || digits.length > 13) return null;
  return digits;
}

function extractWaPhone(jid) {
  const raw = jid.split(':')[0].split('@')[0];
  return raw.replace(/[^\d]/g, '');
}

async function apiPost(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function apiPut(path, jwt, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

function matchChoice(text, ...options) {
  const lower = text.trim().toLowerCase();
  return options.some((opt) => lower === opt || lower.includes(opt));
}

export function isAuthState(state) {
  return !state || state !== 'authenticated';
}

export async function handleAuthFlow(phone, jid, text, session) {
  const state = session?.state || 'new';
  const input = text.trim();

  if (!session || state === 'new') {
    await createSession(phone, { state: 'awaiting_choice' });
    return { reply: WELCOME_MSG, nextState: 'awaiting_choice', done: false };
  }

  if (state === 'awaiting_choice') {
    if (matchChoice(input, '1', 'login', 'لاگ ان', 'log in', 'signin')) {
      await updateSession(phone, { state: 'awaiting_phone_confirm', isSignup: false });
      return {
        reply: `📱 آپ کا WhatsApp نمبر: *+${phone}*\nYour WhatsApp number: *+${phone}*\n\nکیا آپ یہ نمبر استعمال کرنا چاہتے ہیں؟\nDo you want to use this number?\n\n1️⃣ *ہاں* / Yes\n2️⃣ *نہیں، دوسرا نمبر* / No, different number\n\n_Reply with 1 or 2_`,
        nextState: 'awaiting_phone_confirm',
        done: false,
      };
    }
    if (matchChoice(input, '2', 'signup', 'register', 'نیا اکاؤنٹ', 'نیا', 'sign up')) {
      await updateSession(phone, { state: 'awaiting_name', isSignup: true });
      return {
        reply: `📝 براہ کرم اپنا نام لکھیں:\nPlease enter your full name:\n\nمثال / Example: *Ahmed Ali*`,
        nextState: 'awaiting_name',
        done: false,
      };
    }
    return { reply: WELCOME_MSG, nextState: 'awaiting_choice', done: false };
  }

  if (state === 'awaiting_name') {
    if (!input || input.length < 2) {
      return { reply: '⚠️ براہ کرم اپنا نام لکھیں / Please enter your full name.', nextState: 'awaiting_name', done: false };
    }
    await updateSession(phone, { state: 'awaiting_phone_confirm', pendingName: input });
    return {
      reply: `📱 آپ کا WhatsApp نمبر: *+${phone}*\nYour WhatsApp number: *+${phone}*\n\nکیا آپ یہ نمبر استعمال کرنا چاہتے ہیں؟\nDo you want to use this number?\n\n1️⃣ *ہاں* / Yes\n2️⃣ *نہیں، دوسرا نمبر* / No, different number\n\n_Reply with 1 or 2_`,
      nextState: 'awaiting_phone_confirm',
      done: false,
    };
  }

  if (state === 'awaiting_phone_confirm') {
    if (matchChoice(input, '1', 'yes', 'ہاں', 'ha', 'haan', 'ji')) {
      return sendOtpAndTransition(phone, session);
    }
    if (matchChoice(input, '2', 'no', 'نہیں', 'nahi', 'different', 'alag')) {
      await updateSession(phone, { state: 'awaiting_custom_phone' });
      return {
        reply: `📞 براہ کرم اپنا فون نمبر لکھیں:\nPlease enter your phone number:\n\nمثال / Example: *03001234567* or *+923001234567*`,
        nextState: 'awaiting_custom_phone',
        done: false,
      };
    }
    return {
      reply: `⚠️ براہ کرم 1 یا 2 لکھیں / Please reply with 1 or 2.`,
      nextState: 'awaiting_phone_confirm',
      done: false,
    };
  }

  if (state === 'awaiting_custom_phone') {
    const normalized = normalizePhone(input);
    if (!normalized) {
      return {
        reply: `⚠️ غلط نمبر / Invalid number. Please enter a valid Pakistani phone number.\nمثال / Example: *03001234567*`,
        nextState: 'awaiting_custom_phone',
        done: false,
      };
    }
    await updateSession(phone, { pendingOtpPhone: normalized });
    return sendOtpForPhone(phone, normalized, session);
  }

  if (state === 'awaiting_otp') {
    if (matchChoice(input, 'resend', 'dobara', 'دوبارہ', 'again')) {
      const otpPhone = session.pendingOtpPhone || phone;
      const result = await apiPost('/api/auth/otp/resend', { target: `+${otpPhone}`, purpose: 'signup' });
      if (!result.ok) {
        return { reply: `❌ OTP دوبارہ بھیجنے میں مسئلہ / Failed to resend OTP. Please try again.`, nextState: 'awaiting_otp', done: false };
      }
      await updateSession(phone, { otpAttempts: 0 });
      return { reply: OTP_PROMPT(`+${otpPhone}`), nextState: 'awaiting_otp', done: false };
    }

    const codeMatch = input.match(/\d{6}/);
    if (!codeMatch) {
      return { reply: `⚠️ براہ کرم 6 ہندسوں کا کوڈ لکھیں / Please enter the 6-digit code.`, nextState: 'awaiting_otp', done: false };
    }

    const otpPhone = session.pendingOtpPhone || phone;
    const verifyResult = await apiPost('/api/auth/otp/verify', {
      target: `+${otpPhone}`,
      code: codeMatch[0],
      purpose: 'signup',
    });

    if (!verifyResult.ok) {
      const attempts = await incrementOtpAttempts(phone);
      if (attempts >= 3) {
        await deleteSession(phone);
        return {
          reply: `❌ بہت زیادہ کوششیں / Too many failed attempts.\n\nپہلے سے شروع کریں / Starting over.\n\n${WELCOME_MSG}`,
          nextState: 'new',
          done: false,
        };
      }
      const left = 3 - attempts;
      return {
        reply: `❌ غلط کوڈ / Wrong code. ${left} attempt(s) left.\nدوبارہ کوشش کریں / Try again.`,
        nextState: 'awaiting_otp',
        done: false,
      };
    }

    const { token, user } = verifyResult.data;

    if (session.isSignup && session.pendingName) {
      await apiPut('/api/auth/profile', token, { full_name: session.pendingName });
    }

    await updateSession(phone, {
      state: 'authenticated',
      jwt: token,
      userId: user.id,
      userName: user.full_name || session.pendingName || 'User',
      pendingOtpPhone: null,
      pendingName: null,
      otpAttempts: 0,
    });

    const displayName = user.full_name || session.pendingName || 'User';
    return { reply: SUCCESS_MSG(displayName), nextState: 'authenticated', done: true };
  }

  await deleteSession(phone);
  return { reply: WELCOME_MSG, nextState: 'new', done: false };
}

async function sendOtpAndTransition(phone, session) {
  await updateSession(phone, { pendingOtpPhone: phone });
  return sendOtpForPhone(phone, phone, session);
}

async function sendOtpForPhone(sessionPhone, targetPhone, session) {
  const result = await apiPost('/api/auth/otp/send', { target: `+${targetPhone}`, purpose: 'signup' });

  if (!result.ok) {
    return {
      reply: `❌ OTP بھیجنے میں مسئلہ / Failed to send OTP. Please try again.`,
      nextState: 'awaiting_phone_confirm',
      done: false,
    };
  }

  await updateSession(sessionPhone, { state: 'awaiting_otp', pendingOtpPhone: targetPhone, otpAttempts: 0 });
  return { reply: OTP_PROMPT(`+${targetPhone}`), nextState: 'awaiting_otp', done: false };
}
