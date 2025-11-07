import type { Request, Response } from 'express';

import {
  fetchLobbyQuizzes,
  getQuizLobby,
  joinQuiz,
  submitAnswer,
  useLifeline,
} from '../services/quiz.service';
import { ApiError } from '../utils/ApiError';
import { createResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { joinQuizSchema, submitAnswerSchema, useLifelineSchema } from '../validators/quiz.validators';

export const listLobbyQuizzesHandler = asyncHandler(async (_req: Request, res: Response) => {
  const quizzes = await fetchLobbyQuizzes();
  res.json(createResponse({ quizzes }));
});

export const getQuizLobbyHandler = asyncHandler(async (req: Request, res: Response) => {
  const { quizId } = req.params;

  if (!quizId) {
    throw new ApiError(400, 'Quiz ID is required');
  }

  const lobby = await getQuizLobby(quizId);
  res.json(createResponse({ lobby }));
});

export const joinQuizHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { quizId } = joinQuizSchema.parse(req.body);
  const result = await joinQuiz({ quizId, userId: req.user.id });

  res.json(
    createResponse({
      quiz: {
        id: result.quiz._id.toString(),
        title: result.quiz.title,
        type: result.quiz.type,
        status: result.quiz.status,
        settings: result.quiz.settings,
        entryFeeCoins: result.quiz.entryFeeCoins,
        rewardCoins: result.quiz.rewardCoins,
      },
      session: {
        id: result.session._id.toString(),
        status: result.session.status,
        score: result.session.score,
      },
      nextQuestion: result.nextQuestion,
      freeEntry: result.freeEntry,
      usedFreeEntry: result.usedFreeEntry,
    }),
  );
});

export const submitAnswerHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized');
  }

  const payload = submitAnswerSchema.parse(req.body);
  const result = await submitAnswer(payload);

  res.json(createResponse(result));
});

export const useLifelineHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { sessionId } = useLifelineSchema.parse(req.body);

  const result = await useLifeline(sessionId, req.user.id);
  res.json(createResponse(result));
});

