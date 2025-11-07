import { Router } from 'express';

import { claimDailyBonusHandler, getWalletHandler } from '../controllers/user.controller';
import { authGuard } from '../middleware/authGuard';

const router = Router();

router.get('/wallet', authGuard, getWalletHandler);
router.post('/daily-bonus', authGuard, claimDailyBonusHandler);

export default router;


