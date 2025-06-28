import Redis, { type Redis as RedisClient } from 'ioredis';

const redisUrl: string | undefined = import.meta.env.ASTRO_REDIS_URL;

// Префикс ключей из env (например "app1:")
const keyPrefix: string = import.meta.env.ASTRO_CACHE_KEY_PREFIX || '';

// Singleton клиента Redis
let client: RedisClient | null = null;

/**
 * Инициализируем клиент Redis
 * И обработка отключения от Redis с выводом ошибок
 * @returns RedisClient или null в случае ошибки
 */
function initClient(): RedisClient | null {
  if (!redisUrl) return null;
  try {
    const c = new Redis(redisUrl);
    c.on('error', (err: Error) => console.error('Redis Client Error:', err));
    c.on('connect', () => console.log('Redis connected'));
    // Отключение
    if (typeof process !== 'undefined') {
      process.once('SIGINT', async () => {
        await c
          .quit()
          .catch((err) => console.error('Error quitting Redis:', err));
        console.log('Redis quit via SIGINT');
        process.exit(0);
      });
      process.once('SIGTERM', async () => {
        await c
          .quit()
          .catch((err) => console.error('Error quitting Redis:', err));
        console.log('Redis quit via SIGTERM');
        process.exit(0);
      });
    }
    return c;
  } catch (err: any) {
    console.error('Failed to initialize Redis client:', err);
    return null;
  }
}

/**
 * Возвращает RedisClient или null
 */
export function getClient(): RedisClient | null {
  if (!client) {
    client = initClient();
  }
  return client;
}

/**
 * Строит полный ключ с префиксом
 * сделать защиту для ключей от инъекций
 * @param key - ключ без префикса
 * @returns полный ключ с префиксом
 */
function buildKey(key: string): string {
  return `${keyPrefix}${key}`;
}

/**
 * Строит ключ множества для тегов
 */
function buildTagSetKey(tag: string): string {
  return `${keyPrefix}cache:tag:${tag}`;
}

/**
 * Сохраняет данные в кеше с указанным TTL и тегом
 * @returns true при успехе, false при ошибке или недоступном клиенте
 */
export async function setCache({
  key,
  value,
  ttlSeconds = Number(import.meta.env.ASTRO_REDIS_CACHE_TTL) || 10,
  tag = 'all',
}: {
  key: string;
  value: unknown;
  ttlSeconds?: number;
  tag?: string;
}): Promise<boolean> {
  const c = getClient();
  if (!c) return false;
  const fullKey = buildKey(key);
  const data = JSON.stringify(value);
  try {
    await c.set(fullKey, data, 'EX', ttlSeconds);
    await c.sadd(buildTagSetKey(tag), fullKey);
    return true;
  } catch (err) {
    console.error('setCache error:', err);
    return false;
  }
}

/**
 * Получает данные из кеша или null
 */
export async function getCache<T = any>(key: string): Promise<T | null> {
  const c = getClient();
  if (!c) return null;
  const fullKey = buildKey(key);
  try {
    const data = await c.get(fullKey);
    if (data === null) return null;
    return JSON.parse(data) as T;
  } catch (err) {
    console.error('getCache error:', err);
    try {
      await c.del(fullKey);
    } catch {}
    return null;
  }
}

/**
 * Удаляет ключ из кеша
 * @returns true при успехе, false при ошибке или недоступном клиенте
 */
export async function delCache(key: string): Promise<boolean> {
  const c = getClient();
  if (!c) return false;
  try {
    await c.del(buildKey(key));
    return true;
  } catch (err) {
    console.error('delCache error:', err);
    return false;
  }
}

/**
 * Проверяет наличие ключа в кеше
 */
export async function hasCache(key: string): Promise<boolean> {
  const c = getClient();
  if (!c) return false;
  try {
    const exists = await c.exists(buildKey(key));
    return exists > 0;
  } catch (err) {
    console.error('hasCache error:', err);
    return false;
  }
}

/**
 * Полная очистка кеша: сбрасывает всю текущую БД Redis
 * @returns true при успехе, false при ошибке или недоступном клиенте
 */
export async function clearCache(): Promise<boolean> {
  const c = getClient();
  if (!c) return false;
  try {
    await c.flushdb();
    return true;
  } catch (err) {
    console.error('clearCache error:', err);
    return false;
  }
}

/**
 * Очистка кеша по тегу: удаляет все ключи с указанной меткой и саму метку
 * @returns true при успехе, false при ошибке или недоступном клиенте
 */
export async function clearCacheByTag(tag: string = 'all'): Promise<boolean> {
  const c = getClient();
  if (!c) return false;
  const tagSetKey = buildTagSetKey(tag);
  try {
    const keys = await c.smembers(tagSetKey);
    if (keys.length > 0) await c.del(...keys);
    await c.del(tagSetKey);
    return true;
  } catch (err) {
    console.error('clearCacheByTag error:', err);
    return false;
  }
}
