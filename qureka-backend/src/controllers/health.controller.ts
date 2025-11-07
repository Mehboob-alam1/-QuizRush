import type { Request, Response } from 'express';

import { createResponse } from '../utils/apiResponse';

export const healthCheck = (_req: Request, res: Response): void => {
  res.json(
    createResponse({
      status: 'ok',
      timestamp: new Date().toISOString(),
    }),
  );
};


