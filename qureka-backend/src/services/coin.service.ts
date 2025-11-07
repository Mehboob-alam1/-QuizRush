import dayjs from 'dayjs';
import { Types } from 'mongoose';

import { DAILY_LOGIN_BONUS, LIFELINE_COST } from '../config/constants';
import { CoinTransactionModel, type CoinTransactionType } from '../models/CoinTransaction';
import { UserModel } from '../models/User';
import { ApiError } from '../utils/ApiError';

interface AdjustCoinsOptions {
  userId: string;
  amount: number;
  type: CoinTransactionType;
  referenceId?: string;
  metadata?: Record<string, unknown>;
}

export const adjustCoins = async ({ userId, amount, type, referenceId, metadata }: AdjustCoinsOptions) => {
  const user = await UserModel.findById(userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const nextBalance = user.coins + amount;

  if (nextBalance < 0) {
    throw new ApiError(400, 'Insufficient coin balance');
  }

  user.coins = nextBalance;
  await user.save();

  await CoinTransactionModel.create({
    userId: new Types.ObjectId(userId),
    amount,
    balanceAfter: nextBalance,
    type,
    referenceId,
    metadata,
  });

  return nextBalance;
};

export const awardCoins = async (options: Omit<AdjustCoinsOptions, 'amount'> & { amount: number }) => {
  if (options.amount <= 0) {
    throw new ApiError(400, 'Award amount must be positive');
  }

  return adjustCoins(options);
};

export const deductCoins = async (options: Omit<AdjustCoinsOptions, 'amount'> & { amount: number }) => {
  if (options.amount <= 0) {
    throw new ApiError(400, 'Deduction amount must be positive');
  }

  return adjustCoins({ ...options, amount: -Math.abs(options.amount) });
};

export const claimDailyBonus = async (userId: string) => {
  const user = await UserModel.findById(userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const now = dayjs();
  const lastClaim = user.lastDailyBonusAt ? dayjs(user.lastDailyBonusAt) : null;

  if (lastClaim && lastClaim.isSame(now, 'day')) {
    throw new ApiError(400, 'Daily bonus already claimed');
  }

  if (lastClaim && lastClaim.add(1, 'day').isBefore(now, 'day')) {
    user.dailyStreak = 0;
  }

  user.dailyStreak += 1;
  user.lastDailyBonusAt = now.toDate();
  await user.save();

  await awardCoins({
    userId,
    amount: DAILY_LOGIN_BONUS,
    type: 'bonus',
    metadata: { dailyStreak: user.dailyStreak },
  });

  return {
    coins: user.coins,
    dailyStreak: user.dailyStreak,
    lastDailyBonusAt: user.lastDailyBonusAt,
  };
};

export const applyReferralRewards = async (newUserId: string, referrerCode?: string) => {
  if (!referrerCode) {
    return;
  }

  const referrer = await UserModel.findOne({ referralCode: referrerCode });

  if (!referrer) {
    return;
  }

  await awardCoins({
    userId: referrer._id.toString(),
    amount: 100,
    type: 'referral',
    referenceId: newUserId,
  });

  await awardCoins({
    userId: newUserId,
    amount: 50,
    type: 'referral',
    referenceId: referrer._id.toString(),
  });
};

export const chargeLifeline = async (userId: string, sessionId: string) => {
  await deductCoins({
    userId,
    amount: LIFELINE_COST,
    type: 'lifeline',
    referenceId: sessionId,
  });
};

export const chargeQuizEntry = async (userId: string, quizId: string, amount: number) => {
  if (amount <= 0) {
    return;
  }

  await deductCoins({
    userId,
    amount,
    type: 'entry',
    referenceId: quizId,
  });
};

export const rewardQuizCompletion = async (
  userId: string,
  quizId: string,
  amount: number,
) => {
  if (amount <= 0) {
    return;
  }

  await awardCoins({
    userId,
    amount,
    type: 'reward',
    referenceId: quizId,
  });
};

export const getWalletSummary = async (userId: string, limit = 20) => {
  const user = await UserModel.findById(userId).lean();

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const transactions = await CoinTransactionModel.find({ userId: new Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return {
    coins: user.coins,
    dailyStreak: user.dailyStreak,
    lastDailyBonusAt: user.lastDailyBonusAt,
    transactions: transactions.map((txn) => ({
      id: txn._id.toString(),
      type: txn.type,
      amount: txn.amount,
      balanceAfter: txn.balanceAfter,
      referenceId: txn.referenceId,
      metadata: txn.metadata,
      createdAt: txn.createdAt,
    })),
  };
};

export const getLifelineCost = () => LIFELINE_COST;

