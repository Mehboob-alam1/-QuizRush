import type { NextFunction, Request, Response } from 'express';

import { ApiError } from '../utils/ApiError';
import { createErrorResponse } from '../utils/apiResponse';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction): void => {
  void _next;
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = err instanceof ApiError ? err.message : 'Internal server error';

  if (statusCode === 500) {
    console.error('Unhandled error:', err);
  }

  res.status(statusCode).json(createErrorResponse(message));
};

