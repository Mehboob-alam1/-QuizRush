import { Router } from 'express';

import {
  getQuizLobbyHandler,
  joinQuizHandler,
  listLobbyQuizzesHandler,
  submitAnswerHandler,
  useLifelineHandler,
} from '../controllers/quiz.controller';
import { authGuard } from '../middleware/authGuard';

const router = Router();

router.get('/', listLobbyQuizzesHandler);
router.get('/:quizId', getQuizLobbyHandler);
router.post('/join', authGuard, joinQuizHandler);
router.post('/answer', authGuard, submitAnswerHandler);
router.post('/lifeline', authGuard, useLifelineHandler);

export default router;


