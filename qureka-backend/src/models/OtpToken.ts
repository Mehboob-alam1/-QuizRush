import { Schema, model } from 'mongoose';

export interface IOtpToken {
  contact: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
}

const otpTokenSchema = new Schema<IOtpToken>(
  {
    contact: { type: String, required: true, index: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    expireAfterSeconds: 0,
  },
);

otpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpTokenModel = model<IOtpToken>('OtpToken', otpTokenSchema);


