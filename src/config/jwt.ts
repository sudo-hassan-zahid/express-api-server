import type { Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';

export const AUTH_COOKIE_NAME = 'access_token';

export type JwtPayload = {
  id: number;
  email: string;
};

type JwtConfig = {
  secret: string;
  expiresIn: SignOptions['expiresIn'];
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

export const getJwtConfig = (): JwtConfig => {
  if (!isNonEmptyString(process.env.JWT_SECRET)) {
    throw new Error('JWT_SECRET must be configured');
  }

  const expiresIn = (isNonEmptyString(process.env.JWT_EXPIRES_IN)
    ? process.env.JWT_EXPIRES_IN
    : '1d') as SignOptions['expiresIn'];

  return {
    secret: process.env.JWT_SECRET,
    expiresIn,
  };
};

export const signAuthToken = (payload: JwtPayload): string => {
  const jwtConfig = getJwtConfig();

  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  });
};

export const verifyAuthToken = (token: string): JwtPayload => {
  const jwtConfig = getJwtConfig();
  const payload = jwt.verify(token, jwtConfig.secret);

  if (
    !payload ||
    typeof payload !== 'object' ||
    typeof payload.id !== 'number' ||
    typeof payload.email !== 'string'
  ) {
    throw new Error('Invalid auth token payload');
  }

  return {
    id: payload.id,
    email: payload.email,
  };
};

export const setAuthCookie = (res: Response, token: string): void => {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
};

export const clearAuthCookie = (res: Response): void => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
};
