import Redis from 'ioredis';

const SESSION_TTL = (parseInt(process.env.BOT_SESSION_TTL_HOURS, 10) || 24) * 3600;
const KEY_PREFIX = 'sanjhi:wa_session:';

let redis = null;

function getRedis() {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    redis.on('error', (err) => console.error('[BotRedis]', err.message));
    redis.connect().catch(() => {});
  }
  return redis;
}

function key(phone) {
  return `${KEY_PREFIX}${phone}`;
}

export async function getSession(phone) {
  try {
    const raw = await getRedis().get(key(phone));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function createSession(phone, data = {}) {
  const session = {
    state: 'new',
    jwt: null,
    userId: null,
    userName: null,
    detectedLang: null,
    pendingOtpPhone: null,
    pendingName: null,
    otpAttempts: 0,
    conversationHistory: [],
    ...data,
  };
  await getRedis().set(key(phone), JSON.stringify(session), 'EX', SESSION_TTL);
  return session;
}

export async function updateSession(phone, patch) {
  const current = await getSession(phone);
  if (!current) return null;
  const updated = { ...current, ...patch };
  await getRedis().set(key(phone), JSON.stringify(updated), 'EX', SESSION_TTL);
  return updated;
}

export async function deleteSession(phone) {
  await getRedis().del(key(phone));
}

export async function refreshTTL(phone) {
  await getRedis().expire(key(phone), SESSION_TTL);
}

export async function incrementOtpAttempts(phone) {
  const session = await getSession(phone);
  if (!session) return 0;
  session.otpAttempts = (session.otpAttempts || 0) + 1;
  await getRedis().set(key(phone), JSON.stringify(session), 'EX', SESSION_TTL);
  return session.otpAttempts;
}

const RATELIMIT_KEY_PREFIX = 'sanjhi:wa_ratelimit:';
const RATELIMIT_WINDOW_SEC = 60;
const RATELIMIT_MAX = 30;

export async function checkRateLimit(phone) {
  const r = getRedis();
  const rk = `${RATELIMIT_KEY_PREFIX}${phone}`;
  const count = await r.incr(rk);
  if (count === 1) {
    await r.expire(rk, RATELIMIT_WINDOW_SEC);
  }
  return count <= RATELIMIT_MAX;
}
