import { Router } from 'express';

import { requestOtpHandler, verifyOtpHandler, meHandler } from '../controllers/auth.controller';
import { authGuard } from '../middleware/authGuard';

const router = Router();

router.post('/request-otp', requestOtpHandler);
router.post('/verify-otp', verifyOtpHandler);
router.get('/me', authGuard, meHandler);

export default router;


