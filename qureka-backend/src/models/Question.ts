import { Schema, Types, model } from 'mongoose';

export interface IQuestionChoice {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface IQuestion {
  prompt: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimitSeconds: number;
  choices: IQuestionChoice[];
  explanation?: string;
  tags: string[];
  isActive: boolean;
  createdBy: Types.ObjectId;
}

const choiceSchema = new Schema<IQuestionChoice>(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false },
);

const questionSchema = new Schema<IQuestion>(
  {
    prompt: { type: String, required: true },
    category: { type: String, required: true, index: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    timeLimitSeconds: { type: Number, default: 10 },
    choices: {
      type: [choiceSchema],
      validate: {
        validator: (choices: IQuestionChoice[]) => choices.length >= 2,
        message: 'A question must have at least two choices.',
      },
    },
    explanation: { type: String },
    tags: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export const QuestionModel = model<IQuestion>('Question', questionSchema);

