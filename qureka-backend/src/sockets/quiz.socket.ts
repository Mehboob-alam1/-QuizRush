import type { Server, Socket } from 'socket.io';

import { joinQuiz, submitAnswer, useLifeline } from '../services/quiz.service';
import { ApiError } from '../utils/ApiError';
import { verifyAccessToken } from '../utils/jwt';

interface AuthedSocket extends Socket {
  data: {
    userId?: string;
  };
}

export const registerQuizSockets = (io: Server) => {
  io.of('/quiz').use((socket, next) => {
    const token = extractToken(socket as AuthedSocket);

    if (!token) {
      return next(new Error('Unauthorized'));
    }

    try {
      const payload = verifyAccessToken(token);
      (socket as AuthedSocket).data.userId = payload.sub;
      return next();
    } catch {
      return next(new Error('Unauthorized'));
    }
  });

  io.of('/quiz').on('connection', (socket: AuthedSocket) => {
    const userId = socket.data.userId;

    if (!userId) {
      socket.disconnect(true);
      return;
    }

    socket.on('quiz:join', async (payload: { quizId: string }) => {
      try {
        const result = await joinQuiz({ quizId: payload.quizId, userId });
        const roomId = `quiz:${payload.quizId}`;
        void socket.join(roomId);
        socket.emit('quiz:joined', {
          quiz: {
            id: result.quiz._id.toString(),
            title: result.quiz.title,
            type: result.quiz.type,
            status: result.quiz.status,
            settings: result.quiz.settings,
          },
          sessionId: result.session._id.toString(),
          nextQuestion: result.nextQuestion,
          freeEntry: result.freeEntry,
          usedFreeEntry: result.usedFreeEntry,
        });
      } catch (error) {
        emitSocketError(socket, error);
      }
    });

    socket.on(
      'quiz:answer',
      async (payload: { sessionId: string; questionId: string; selectedChoiceId: string; timeTakenMs: number }) => {
        try {
          const result = await submitAnswer(payload);
          socket.emit('quiz:answer:ack', result);
        } catch (error) {
          emitSocketError(socket, error);
        }
      },
    );

    socket.on('quiz:lifeline', async (payload: { sessionId: string }) => {
      try {
        const result = await useLifeline(payload.sessionId, userId);
        socket.emit('quiz:lifeline:ack', result);
      } catch (error) {
        emitSocketError(socket, error);
      }
    });
  });
};

const emitSocketError = (socket: Socket, error: unknown) => {
  if (error instanceof ApiError) {
    socket.emit('quiz:error', { statusCode: error.statusCode, message: error.message });
  } else if (error instanceof Error) {
    socket.emit('quiz:error', { statusCode: 500, message: error.message });
  } else {
    socket.emit('quiz:error', { statusCode: 500, message: 'Unknown error' });
  }
};

const extractToken = (socket: AuthedSocket): string | undefined => {
  const authPayload = socket.handshake.auth as Record<string, unknown> | undefined;
  const tokenValue = authPayload?.token;
  if (typeof tokenValue === 'string' && tokenValue.length > 0) {
    return stripBearer(tokenValue);
  }

  return undefined;
};

const stripBearer = (value: string): string => {
  return value.startsWith('Bearer ') ? value.slice(7) : value;
};

