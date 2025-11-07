import { Router } from 'express';

import authRouter from './auth.route';
import healthRouter from './health.route';
import quizRouter from './quiz.route';
import userRouter from './user.route';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/quizzes', quizRouter);
router.use('/users', userRouter);

// TODO: mount feature routers:
// router.use('/leaderboard', leaderboardRouter);
// router.use('/admin', adminRouter);

export default router;

