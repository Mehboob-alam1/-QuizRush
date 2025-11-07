import dayjs from 'dayjs';
import { Types } from 'mongoose';

import { DEFAULT_COIN_BALANCE, OTP_EXPIRY_MINUTES } from '../config/constants';
import { env } from '../config/env';
import { OtpTokenModel } from '../models/OtpToken';
import { IUser, UserModel } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { signAccessToken } from '../utils/jwt';
import { generateOtpCode, hashOtpCode, verifyOtpCode } from '../utils/otp';
import { generateReferralCode } from '../utils/referral';
import { applyReferralRewards } from './coin.service';

interface RequestOtpInput {
  contact: string;
}

interface VerifyOtpInput {
  contact: string;
  code: string;
  displayName?: string;
  referralCode?: string;
}

const normalizeContact = (contact: string): string => contact.trim().toLowerCase();

export async function requestOtp({ contact }: RequestOtpInput) {
  const normalized = normalizeContact(contact);
  const code = env.NODE_ENV === 'development' && env.OTP_DEV_BYPASS ? '000000' : generateOtpCode();
  const codeHash = await hashOtpCode(code);

  const expiresAt = dayjs().add(OTP_EXPIRY_MINUTES, 'minute').toDate();

  await OtpTokenModel.findOneAndUpdate(
    { contact: normalized },
    { contact: normalized, codeHash, expiresAt, attempts: 0 },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return {
    contact: normalized,
    expiresAt,
    code: env.NODE_ENV === 'development' ? code : undefined,
  };
}

export async function verifyOtp({ contact, code, displayName, referralCode }: VerifyOtpInput) {
  const normalized = normalizeContact(contact);

  const record = await OtpTokenModel.findOne({ contact: normalized });

  if (!record) {
    throw new ApiError(400, 'OTP not found or expired. Please request a new one.');
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await record.deleteOne();
    throw new ApiError(400, 'OTP expired. Please request a new one.');
  }

  const isValid = await verifyOtpCode(code, record.codeHash);

  if (!isValid) {
    record.attempts += 1;
    await record.save();

    if (record.attempts >= 5) {
      await record.deleteOne();
    }

    throw new ApiError(400, 'Invalid OTP code.');
  }

  await record.deleteOne();

  let user = await UserModel.findOne({ $or: [{ email: normalized }, { phone: normalized }] });

  if (!user) {
    const referralCodeValue = await createUniqueReferralCode();

    user = await UserModel.create({
      displayName: deriveDisplayName(normalized, displayName),
      email: normalized.includes('@') ? normalized : undefined,
      phone: normalized.includes('@') ? undefined : normalized,
      coins: DEFAULT_COIN_BALANCE,
      badges: [],
      referralCode: referralCodeValue,
      referredBy: referralCode,
      dailyStreak: 0,
      stats: {
        totalQuizzes: 0,
        wins: 0,
        streak: 0,
        bestRank: 0,
      },
      role: 'player',
    });

    await applyReferralRewards(user._id.toString(), referralCode);
  }

  const persistedUser = await UserModel.findById(user._id).lean<IUser & { _id: Types.ObjectId }>();

  if (!persistedUser) {
    throw new ApiError(500, 'Failed to load user');
  }

  const userId = persistedUser._id.toString();
  const token = signAccessToken({ id: userId, role: persistedUser.role });

  return {
    token,
    user: {
      ...persistedUser,
      id: userId,
    },
  };
}

const deriveDisplayName = (contact: string, fallback?: string): string => {
  if (fallback && fallback.trim().length > 1) {
    return fallback.trim();
  }

  if (contact.includes('@')) {
    return contact.split('@')[0];
  }

  return `Player-${contact.slice(-4)}`;
};

const createUniqueReferralCode = async (): Promise<string> => {
  for (let attempts = 0; attempts < 5; attempts += 1) {
    const code = generateReferralCode();
    const exists = await UserModel.exists({ referralCode: code });
    if (!exists) {
      return code;
    }
  }

  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
};


