import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

import { OTP_CODE_LENGTH } from '../config/constants';

export const generateOtpCode = (): string => {
  const max = 10 ** OTP_CODE_LENGTH;
  const random = crypto.randomInt(0, max);
  return random.toString().padStart(OTP_CODE_LENGTH, '0');
};

export const hashOtpCode = async (code: string): Promise<string> => {
  return bcrypt.hash(code, 10);
};

export const verifyOtpCode = async (code: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(code, hash);
};

