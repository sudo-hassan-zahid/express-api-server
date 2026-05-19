import 'dotenv/config';
import { createClient } from 'redis';
import { logger } from '../services/logger.service.js';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = createClient({ url: redisUrl });

let connectPromise: Promise<void> | null = null;

redis.on('error', (error) => {
  logger.error('Redis client error', { error });
});

redis.on('ready', () => {
  logger.info('Redis client ready');
});

export const connectRedis = async (): Promise<void> => {
  if (redis.isReady) return;

  connectPromise ??= redis
    .connect()
    .then(() => undefined)
    .finally(() => {
      connectPromise = null;
    });

  await connectPromise;
};

const withRedis = async <T>(operation: () => Promise<T>, fallback: T): Promise<T> => {
  try {
    await connectRedis();
    return await operation();
  } catch (error) {
    logger.warn('Redis operation failed', { error });
    return fallback;
  }
};

export const redisPing = async (): Promise<string | null> => {
  return withRedis(() => redis.ping(), null);
};

export const redisGetJson = async <T>(key: string): Promise<T | null> => {
  const value = await withRedis(() => redis.get(key), null);
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    logger.warn('Failed to parse cached JSON value', { key, error });
    await redisDelete(key);
    return null;
  }
};

export const redisSetJson = async <T>(
  key: string,
  value: T,
  ttlSeconds?: number
): Promise<boolean> => {
  return withRedis(async () => {
    const serialized = JSON.stringify(value);

    if (ttlSeconds && ttlSeconds > 0) {
      await redis.set(key, serialized, { EX: ttlSeconds });
    } else {
      await redis.set(key, serialized);
    }

    return true;
  }, false);
};

export const redisDelete = async (key: string): Promise<boolean> => {
  return withRedis(async () => {
    await redis.del(key);
    return true;
  }, false);
};

export const disconnectRedis = async (): Promise<void> => {
  if (!redis.isOpen) return;
  await redis.quit();
};

export default redis;
 