import type { NextFunction, Request, Response } from 'express';

import { UserModel } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { verifyAccessToken } from '../utils/jwt';

export const authGuard = async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authorization header missing'));
  }

  const token = header.slice(7);

  try {
    const payload = verifyAccessToken(token);
    const user = await UserModel.findById(payload.sub).lean();

    if (!user) {
      return next(new ApiError(401, 'User not found'));
    }

    req.user = { ...user, id: user._id.toString() };
    return next();
  } catch {
    return next(new ApiError(401, 'Invalid or expired token'));
  }
};

export const adminGuard = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new ApiError(403, 'Admin access required'));
  }
  return next();
};

