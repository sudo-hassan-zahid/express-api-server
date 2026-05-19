import { redisDelete, redisGetJson, redisSetJson } from '../config/redis.js';

export type CachedUser = {
  id: number;
  name: string;
  email: string;
  password: string;
  deleted_at?: Date | string | null;
};

const defaultUserCacheTtlSeconds = 300;

const getUserCacheTtlSeconds = (): number => {
  const ttl = Number(process.env.REDIS_USER_CACHE_TTL_SECONDS);
  return Number.isFinite(ttl) && ttl > 0 ? ttl : defaultUserCacheTtlSeconds;
};

export const normalizeUserEmail = (email: string): string => email.trim().toLowerCase();

const userByEmailKey = (email: string): string => `users:email:${normalizeUserEmail(email)}`;
const userByIdKey = (id: number): string => `users:id:${id}`;

export const getCachedUserByEmail = async (email: string): Promise<CachedUser | null> => {
  return redisGetJson<CachedUser>(userByEmailKey(email));
};

export const getCachedUserById = async (id: number): Promise<CachedUser | null> => {
  return redisGetJson<CachedUser>(userByIdKey(id));
};

export const cacheUser = async (user: CachedUser): Promise<boolean> => {
  const ttlSeconds = getUserCacheTtlSeconds();
  const [cachedByEmail, cachedById] = await Promise.all([
    redisSetJson(userByEmailKey(user.email), user, ttlSeconds),
    redisSetJson(userByIdKey(user.id), user, ttlSeconds),
  ]);

  return cachedByEmail && cachedById;
};

export const clearCachedUserByEmail = async (email: string): Promise<boolean> => {
  return redisDelete(userByEmailKey(email));
};

export const clearCachedUserById = async (id: number): Promise<boolean> => {
  return redisDelete(userByIdKey(id));
};

export const clearCachedUser = async (user: { id: number; email: string }): Promise<boolean> => {
  const [clearedByEmail, clearedById] = await Promise.all([
    clearCachedUserByEmail(user.email),
    clearCachedUserById(user.id),
  ]);

  return clearedByEmail && clearedById;
};
