import { Schema, Types, model } from 'mongoose';

export type QuizSessionStatus = 'pending' | 'active' | 'completed' | 'eliminated';

export interface IQuizAnswer {
  questionId: Types.ObjectId;
  selectedChoiceId: string;
  isCorrect: boolean;
  timeTakenMs: number;
}

export interface IQuizSession {
  quizId: Types.ObjectId;
  userId: Types.ObjectId;
  status: QuizSessionStatus;
  score: number;
  coinsEarned: number;
  lifelinesUsed: number;
  answers: IQuizAnswer[];
  questionOrder: Types.ObjectId[];
  currentQuestionIndex: number;
  startedAt?: Date;
  completedAt?: Date;
}

const answerSchema = new Schema<IQuizAnswer>(
  {
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    selectedChoiceId: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    timeTakenMs: { type: Number, default: 0 },
  },
  { _id: false },
);

const quizSessionSchema = new Schema<IQuizSession>(
  {
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['pending', 'active', 'completed', 'eliminated'], default: 'pending' },
    score: { type: Number, default: 0 },
    coinsEarned: { type: Number, default: 0 },
    lifelinesUsed: { type: Number, default: 0 },
    answers: { type: [answerSchema], default: [] },
    questionOrder: { type: [Schema.Types.ObjectId], ref: 'Question', default: [] },
    currentQuestionIndex: { type: Number, default: 0 },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

quizSessionSchema.index({ quizId: 1, userId: 1 }, { unique: true });

export const QuizSessionModel = model<IQuizSession>('QuizSession', quizSessionSchema);

