import jwt, { type SignOptions } from 'jsonwebtoken';

type JwtPayload = {
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
