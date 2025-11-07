import { Schema, Types, model } from 'mongoose';

export type QuizType = 'live' | 'instant';
export type QuizStatus = 'draft' | 'scheduled' | 'live' | 'completed';

interface QuizSettings {
  questionsPerGame: number;
  questionTimeLimit: number;
  allowLifelines: boolean;
  lifelineCost: number;
}

export interface IQuiz {
  title: string;
  description?: string;
  category: string;
  type: QuizType;
  status: QuizStatus;
  startTime: Date;
  endTime?: Date;
  entryFeeCoins: number;
  rewardCoins: number;
  questionIds: Types.ObjectId[];
  hostNotes?: string;
  settings: QuizSettings;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
}

const quizSettingsSchema = new Schema<QuizSettings>(
  {
    questionsPerGame: { type: Number, default: 10 },
    questionTimeLimit: { type: Number, default: 10 },
    allowLifelines: { type: Boolean, default: true },
    lifelineCost: { type: Number, default: 30 },
  },
  { _id: false },
);

const quizSchema = new Schema<IQuiz>(
  {
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true, index: true },
    type: { type: String, enum: ['live', 'instant'], default: 'live' },
    status: { type: String, enum: ['draft', 'scheduled', 'live', 'completed'], default: 'draft' },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date },
    entryFeeCoins: { type: Number, default: 0 },
    rewardCoins: { type: Number, default: 0 },
    questionIds: [{ type: Schema.Types.ObjectId, ref: 'Question', required: true }],
    hostNotes: { type: String },
    settings: { type: quizSettingsSchema, default: {} },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

quizSchema.virtual('durationSeconds').get(function durationSeconds(this: IQuiz) {
  if (!this.startTime || !this.endTime) {
    return this.settings.questionsPerGame * this.settings.questionTimeLimit;
  }
  return Math.max(0, Math.round((this.endTime.getTime() - this.startTime.getTime()) / 1000));
});

export const QuizModel = model<IQuiz>('Quiz', quizSchema);


