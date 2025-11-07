import { Types } from 'mongoose';

import { FREE_ENTRY_QUIZ_LIMIT_PER_DAY, LIFELINE_COST, MAX_LIFELINES_PER_QUIZ } from '../config/constants';
import { QuestionModel, type IQuestion, type IQuestionChoice } from '../models/Question';
import { QuizModel, type IQuiz } from '../models/Quiz';
import { QuizSessionModel, type IQuizSession } from '../models/QuizSession';
import { ApiError } from '../utils/ApiError';
import { chargeLifeline, chargeQuizEntry, rewardQuizCompletion } from './coin.service';

interface LobbyQuizSummary {
  id: string;
  title: string;
  category: string;
  type: IQuiz['type'];
  status: IQuiz['status'];
  startTime: string;
  entryFeeCoins: number;
  rewardCoins: number;
  totalQuestions: number;
}

interface ClientQuestion {
  id: string;
  prompt: string;
  category: string;
  difficulty: IQuestion['difficulty'];
  timeLimitSeconds: number;
  choices: Array<Pick<IQuestionChoice, 'id' | 'text'>>;
}

export async function fetchLobbyQuizzes(): Promise<LobbyQuizSummary[]> {
  const now = new Date();
  const quizzes = await QuizModel.find({
    status: { $in: ['scheduled', 'live'] },
    startTime: { $gte: new Date(now.getTime() - 60 * 60 * 1000) },
  })
    .sort({ startTime: 1 })
    .limit(20)
    .lean();

  return quizzes.map((quiz) => ({
    id: quiz._id.toString(),
    title: quiz.title,
    category: quiz.category,
    type: quiz.type,
    status: quiz.status,
    startTime: quiz.startTime.toISOString(),
    entryFeeCoins: quiz.entryFeeCoins,
    rewardCoins: quiz.rewardCoins,
    totalQuestions: quiz.settings.questionsPerGame,
  }));
}

export async function getQuizLobby(quizId: string) {
  const quiz = await QuizModel.findById(quizId).lean();

  if (!quiz) {
    throw new ApiError(404, 'Quiz not found');
  }

  return {
    id: quiz._id.toString(),
    title: quiz.title,
    description: quiz.description,
    category: quiz.category,
    type: quiz.type,
    status: quiz.status,
    startTime: quiz.startTime,
    entryFeeCoins: quiz.entryFeeCoins,
    rewardCoins: quiz.rewardCoins,
    settings: quiz.settings,
    questionCount: quiz.questionIds.length,
  };
}

export interface JoinQuizInput {
  quizId: string;
  userId: string;
}

export async function joinQuiz({ quizId, userId }: JoinQuizInput) {
  const quiz = await QuizModel.findById(quizId).lean<IQuiz & { _id: Types.ObjectId }>();

  if (!quiz) {
    throw new ApiError(404, 'Quiz not found');
  }

  if (quiz.status === 'completed') {
    throw new ApiError(400, 'Quiz already completed');
  }

  if (!quiz.questionIds?.length) {
    throw new ApiError(400, 'Quiz has no questions. Please try later.');
  }

  let session = await QuizSessionModel.findOne({
    quizId: quiz._id,
    userId: new Types.ObjectId(userId),
  });

  let usedFreeEntry = false;

  if (!session) {
    const freeEntryUsage = await countFreeEntriesForToday(userId);
    usedFreeEntry = quiz.entryFeeCoins > 0 && freeEntryUsage.count < FREE_ENTRY_QUIZ_LIMIT_PER_DAY;

    if (quiz.entryFeeCoins > 0 && !usedFreeEntry) {
      await chargeQuizEntry(userId, quiz._id.toString(), quiz.entryFeeCoins);
    }

    const questionOrder = selectQuestionOrder(quiz);
    session = await QuizSessionModel.create({
      quizId: quiz._id,
      userId: new Types.ObjectId(userId),
      status: quiz.status === 'live' ? 'active' : 'pending',
      questionOrder,
      startedAt: new Date(),
      score: 0,
      answers: [],
      currentQuestionIndex: 0,
    });
  }

  const nextQuestion = await loadQuestionForSession(session);
  const freeEntry = await countFreeEntriesForToday(userId);

  return {
    quiz,
    session: session.toObject<IQuizSession & { _id: Types.ObjectId }>(),
    nextQuestion,
    freeEntry,
    usedFreeEntry,
  };
}

export interface SubmitAnswerInput {
  sessionId: string;
  questionId: string;
  selectedChoiceId: string;
  timeTakenMs: number;
}

export async function submitAnswer({ sessionId, questionId, selectedChoiceId, timeTakenMs }: SubmitAnswerInput) {
  const session = await QuizSessionModel.findById(sessionId);

  if (!session) {
    throw new ApiError(404, 'Quiz session not found');
  }

  if (session.status !== 'active' && session.status !== 'pending') {
    throw new ApiError(400, 'Quiz session is not active');
  }

  const expectedQuestionId = session.questionOrder[session.currentQuestionIndex];

  if (!expectedQuestionId || expectedQuestionId.toString() !== questionId) {
    throw new ApiError(400, 'This question is no longer active');
  }

  const question = await QuestionModel.findById(questionId).lean<IQuestion & { _id: Types.ObjectId }>();

  if (!question) {
    throw new ApiError(404, 'Question not found');
  }

  const selectedChoice = question.choices.find((choice) => choice.id === selectedChoiceId);

  if (!selectedChoice) {
    throw new ApiError(400, 'Invalid answer choice');
  }

  const isCorrect = Boolean(selectedChoice.isCorrect);
  const incrementScore = isCorrect ? calculateScore(timeTakenMs) : 0;
  const previouslyCompleted = Boolean(session.completedAt);

  session.answers.push({
    questionId: new Types.ObjectId(questionId),
    selectedChoiceId,
    isCorrect,
    timeTakenMs,
  });

  session.score += incrementScore;
  session.currentQuestionIndex += 1;
  const reachedEnd = session.currentQuestionIndex >= session.questionOrder.length;
  session.status = reachedEnd ? 'completed' : 'active';

  if (reachedEnd && !previouslyCompleted) {
    session.completedAt = new Date();
  }

  await session.save();

  if (reachedEnd && !previouslyCompleted) {
    const quiz = await QuizModel.findById(session.quizId).lean<IQuiz & { _id: Types.ObjectId }>();
    if (quiz?.rewardCoins) {
      await rewardQuizCompletion(session.userId.toString(), session.quizId.toString(), quiz.rewardCoins);
    }
  }

  const nextQuestion = session.status === 'completed' ? null : await loadQuestionForSession(session);

  return {
    isCorrect,
    score: session.score,
    status: session.status,
    nextQuestion,
  };
}

export async function useLifeline(sessionId: string, userId: string) {
  const session = await QuizSessionModel.findById(sessionId);

  if (!session) {
    throw new ApiError(404, 'Session not found');
  }

  if (session.userId.toString() !== userId) {
    throw new ApiError(403, 'You cannot use a lifeline on this session');
  }

  if (session.lifelinesUsed >= MAX_LIFELINES_PER_QUIZ) {
    throw new ApiError(400, 'Maximum lifelines consumed');
  }

  await chargeLifeline(userId, sessionId);
  session.lifelinesUsed += 1;
  await session.save();

  return {
    lifelinesUsed: session.lifelinesUsed,
    cost: LIFELINE_COST,
  };
}

const selectQuestionOrder = (quiz: IQuiz & { _id: Types.ObjectId }) => {
  const shuffled = [...quiz.questionIds].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, quiz.settings.questionsPerGame);
};

const loadQuestionForSession = async (
  session: IQuizSession,
): Promise<ClientQuestion | null> => {
  const questionId = session.questionOrder[session.currentQuestionIndex];

  if (!questionId) {
    return null;
  }

  const question = await QuestionModel.findById(questionId).lean<IQuestion & { _id: Types.ObjectId }>();

  if (!question) {
    return null;
  }

  return mapQuestionToClient(question);
};

const mapQuestionToClient = (
  question: IQuestion & {
    _id: Types.ObjectId;
    choices: IQuestionChoice[];
  },
): ClientQuestion => ({
  id: question._id.toString(),
  prompt: question.prompt,
  category: question.category,
  difficulty: question.difficulty,
  timeLimitSeconds: question.timeLimitSeconds,
  choices: question.choices.map((choice) => ({
    id: choice.id,
    text: choice.text,
  })),
});

const calculateScore = (timeTakenMs: number): number => {
  const fastBonus = Math.max(0, 10000 - timeTakenMs);
  return 10 + Math.round(fastBonus / 1000);
};

export async function countFreeEntriesForToday(userId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const count = await QuizSessionModel.countDocuments({
    userId: new Types.ObjectId(userId),
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  });

  return {
    count,
    remaining: Math.max(0, FREE_ENTRY_QUIZ_LIMIT_PER_DAY - count),
  };
}

