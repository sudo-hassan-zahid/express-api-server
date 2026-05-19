import { redisDelete, redisGetJson, redisSetJson } from '../config/redis.js';

type CachedUser = {
  id: number;
  name: string;
  email: string;
  password: string;
};

const defaultUserCacheTtlSeconds = 300;

const getUserCacheTtlSeconds = (): number => {
  const ttl = Number(process.env.REDIS_USER_CACHE_TTL_SECONDS);
  return Number.isFinite(ttl) && ttl > 0 ? ttl : defaultUserCacheTtlSeconds;
};

export const normalizeUserEmail = (email: string): string => email.trim().toLowerCase();

const userByEmailKey = (email: string): string => `users:email:${normalizeUserEmail(email)}`;

export const getCachedUserByEmail = async (email: string): Promise<CachedUser | null> => {
  return redisGetJson<CachedUser>(userByEmailKey(email));
};

export const cacheUser = async (user: CachedUser): Promise<boolean> => {
  return redisSetJson(userByEmailKey(user.email), user, getUserCacheTtlSeconds());
};

export const clearCachedUserByEmail = async (email: string): Promise<boolean> => {
  return redisDelete(userByEmailKey(email));
};
