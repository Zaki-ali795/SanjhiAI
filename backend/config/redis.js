import Redis from 'ioredis';

let redisClient = null;
let isConnected = false;

/**
 * Returns a singleton ioredis client instance.
 * Gracefully handles offline or missing Redis without crashing the Node.js process.
 */
export function getRedisClient() {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy(times) {
        if (times > 5) {
          return null; // Stop retrying after 5 failed attempts to prevent log spam
        }
        return Math.min(times * 200, 2000);
      },
    });

    redisClient.on('connect', () => {
      isConnected = true;
      console.log('⚡ [Redis] Connected successfully to Redis server.');
    });

    redisClient.on('ready', () => {
      isConnected = true;
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      // Log once per disconnect, do not throw
    });

    redisClient.on('close', () => {
      isConnected = false;
    });

    redisClient.connect().catch(() => {
      // Gracefully handle initial offline state
    });
  }

  return redisClient;
}

/**
 * Safe GET from Redis cache.
 * Returns parsed JSON value or null on miss/error.
 */
export async function getCache(key) {
  try {
    const client = getRedisClient();
    const raw = await client.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Safe SET in Redis cache with TTL in seconds.
 */
export async function setCache(key, value, ttlSeconds = 60) {
  try {
    const client = getRedisClient();
    const stringified = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await client.set(key, stringified, 'EX', ttlSeconds);
    } else {
      await client.set(key, stringified);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Safe DELETE a specific key from Redis cache.
 */
export async function delCache(key) {
  try {
    const client = getRedisClient();
    await client.del(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safe pattern-based deletion (e.g. 'sanjhi:cache:public_committees:*').
 */
export async function delCachePattern(pattern) {
  try {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
    return true;
  } catch {
    return false;
  }
}
