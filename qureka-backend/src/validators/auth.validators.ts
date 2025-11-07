import { z } from 'zod';

export const requestOtpSchema = z.object({
  contact: z.string().min(3, 'Provide a valid email or phone number'),
});

export const verifyOtpSchema = z.object({
  contact: z.string().min(3),
  code: z.string().length(6),
  displayName: z.string().min(2).max(40).optional(),
  referralCode: z.string().min(4).max(12).optional(),
});


