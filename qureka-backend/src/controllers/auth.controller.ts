import type { Request, Response } from 'express';

import { requestOtp, verifyOtp } from '../services/auth.service';
import { ApiError } from '../utils/ApiError';
import { createResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { requestOtpSchema, verifyOtpSchema } from '../validators/auth.validators';

export const requestOtpHandler = asyncHandler(async (req: Request, res: Response) => {
  const { contact } = requestOtpSchema.parse(req.body);

  const result = await requestOtp({ contact });

  res.status(201).json(
    createResponse({
      contact: result.contact,
      expiresAt: result.expiresAt,
      otp: result.code,
    }, 'OTP sent successfully'),
  );
});

export const verifyOtpHandler = asyncHandler(async (req: Request, res: Response) => {
  const { contact, code, displayName, referralCode } = verifyOtpSchema.parse(req.body);

  const { token, user } = await verifyOtp({ contact, code, displayName, referralCode });

  res.json(
    createResponse(
      {
        token,
        user,
      },
      'OTP verified successfully',
    ),
  );
});

export const meHandler = asyncHandler((req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized');
  }

  res.json(createResponse({ user: req.user }));
});

