import Redis from 'ioredis';

const log = (msg: string, data?: unknown) => {
  console.log(`[${new Date().toISOString()}] [REDIS] ${msg}`, data ?? '');
};

const HISTORY_TTL = 3600;
const LLM_CACHE_TTL = 1800;
const SESSION_TTL = 7200;

let redis: Redis | null = null;
let available = false;

try {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  log('Initializing Redis client', { url: url.replace(/\/\/.*@/, '//***@') });
  redis = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) {
        log('Redis retry exhausted, giving up');
        return null;
      }
      return Math.min(times * 200, 1000);
    },
    lazyConnect: true,
  });

  redis.on('error', (err) => {
    log('Redis connection error', { message: (err as Error).message });
    available = false;
  });

  redis.on('ready', () => {
    log('Redis connected and ready');
    available = true;
  });

  redis.connect().catch((err) => {
    log('Redis connect failed — cache disabled', { error: (err as Error).message });
    available = false;
  });
} catch (err) {
  log('Redis instantiation error — cache disabled', { error: (err as Error).message });
  available = false;
}

function isAvailable(): boolean {
  return available && redis !== null;
}

function hashKey(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export async function getCache<T>(key: string): Promise<T | null> {
  if (!isAvailable()) {
    log('Cache unavailable — skipping get', { key });
    return null;
  }
  try {
    const data = await redis!.get(key);
    if (data) {
      log('Cache GET hit', { key });
      return JSON.parse(data) as T;
    }
    log('Cache GET miss', { key });
    return null;
  } catch (err) {
    log('Cache GET error', { key, error: (err as Error).message });
    return null;
  }
}

export async function setCache(
  key: string,
  value: unknown,
  ttl: number = HISTORY_TTL,
): Promise<void> {
  if (!isAvailable()) {
    log('Cache unavailable — skipping set', { key });
    return;
  }
  try {
    await redis!.setex(key, ttl, JSON.stringify(value));
    log('Cache SET', { key, ttl });
  } catch (err) {
    log('Cache SET error', { key, error: (err as Error).message });
  }
}

export async function delCache(key: string): Promise<void> {
  if (!isAvailable()) {
    log('Cache unavailable — skipping del', { key });
    return;
  }
  try {
    await redis!.del(key);
    log('Cache DEL', { key });
  } catch (err) {
    log('Cache DEL error', { key, error: (err as Error).message });
  }
}

export function historyKey(sessionId: string): string {
  return `history:${sessionId}`;
}

export function sessionKey(sessionId: string): string {
  return `session:${sessionId}`;
}

export function llmCacheKey(userMessage: string, lastAiMessage?: string): string {
  const input = lastAiMessage
    ? `${userMessage}||${lastAiMessage.slice(-100)}`
    : userMessage;
  return `llm:${hashKey(input)}`;
}

export { HISTORY_TTL, LLM_CACHE_TTL, SESSION_TTL };
