import type { Request, Response } from 'express';

import { claimDailyBonus, getWalletSummary } from '../services/coin.service';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { createResponse } from '../utils/apiResponse';

export const getWalletHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized');
  }

  const wallet = await getWalletSummary(req.user.id);
  res.json(createResponse({ wallet }));
});

export const claimDailyBonusHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized');
  }

  const result = await claimDailyBonus(req.user.id);
  res.json(createResponse(result, 'Daily bonus claimed'));
});


