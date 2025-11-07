import { Schema, Types, model } from 'mongoose';

export type CoinTransactionType =
  | 'bonus'
  | 'entry'
  | 'lifeline'
  | 'reward'
  | 'referral'
  | 'admin_adjustment'
  | 'purchase'
  | 'refund';

export interface ICoinTransaction {
  userId: Types.ObjectId;
  amount: number;
  balanceAfter: number;
  type: CoinTransactionType;
  referenceId?: string;
  metadata?: Record<string, unknown>;
}

const coinTransactionSchema = new Schema<ICoinTransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    type: {
      type: String,
      enum: ['bonus', 'entry', 'lifeline', 'reward', 'referral', 'admin_adjustment', 'purchase', 'refund'],
      required: true,
    },
    referenceId: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

coinTransactionSchema.index({ userId: 1, createdAt: -1 });

export const CoinTransactionModel = model<ICoinTransaction>('CoinTransaction', coinTransactionSchema);

