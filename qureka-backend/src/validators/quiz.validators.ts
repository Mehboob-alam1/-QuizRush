import { z } from 'zod';

export const joinQuizSchema = z.object({
  quizId: z.string().min(1),
});

export const submitAnswerSchema = z.object({
  sessionId: z.string().min(1),
  questionId: z.string().min(1),
  selectedChoiceId: z.string().min(1),
  timeTakenMs: z.number().int().nonnegative().max(12000),
});

export const useLifelineSchema = z.object({
  sessionId: z.string().min(1),
});

