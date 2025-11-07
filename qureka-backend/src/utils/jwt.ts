import jwt, { type SignOptions, type VerifyOptions } from 'jsonwebtoken';

import { env } from '../config/env';
import type { IUser } from '../models/User';

interface JwtPayload {
  sub: string;
  role: IUser['role'];
}

export const signAccessToken = (user: { id: string; role: IUser['role'] }): string => {
  const payload: JwtPayload = {
    sub: user.id,
    role: user.role,
  };

  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
};

export const verifyAccessToken = (token: string): JwtPayload => {
  const options: VerifyOptions = {};
  return jwt.verify(token, env.JWT_SECRET, options) as JwtPayload;
};

