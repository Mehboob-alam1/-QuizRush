import { Schema, model } from 'mongoose';

export interface IUser {
  displayName: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  coins: number;
  badges: string[];
  referralCode?: string;
  referredBy?: string;
  dailyStreak: number;
  lastDailyBonusAt?: Date;
  stats: {
    totalQuizzes: number;
    wins: number;
    streak: number;
    bestRank: number;
  };
  role: 'player' | 'admin';
}

const userSchema = new Schema<IUser>(
  {
    displayName: { type: String, required: true },
    email: { type: String, index: true, unique: true, sparse: true },
    phone: { type: String, index: true, unique: true, sparse: true },
    photoUrl: String,
    coins: { type: Number, default: 0 },
    badges: { type: [String], default: [] },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: String },
    dailyStreak: { type: Number, default: 0 },
    lastDailyBonusAt: { type: Date },
    stats: {
      totalQuizzes: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      streak: { type: Number, default: 0 },
      bestRank: { type: Number, default: 0 },
    },
    role: { type: String, enum: ['player', 'admin'], default: 'player' },
  },
  { timestamps: true },
);

export const UserModel = model<IUser>('User', userSchema);

