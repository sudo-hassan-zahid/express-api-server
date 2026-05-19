import type { RequestHandler } from 'express';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '../config/jwt.js';

export const requireAuth: RequestHandler = (req, res, next) => {
  const token = req.cookies?.[AUTH_COOKIE_NAME];

  if (typeof token !== 'string' || token.trim().length === 0) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    req.auth = verifyAuthToken(token);
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired auth token' });
  }
};
