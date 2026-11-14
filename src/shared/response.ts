import { Response } from 'express';
import { ApiSuccessResponse, ApiErrorResponse } from './types.js';

export function sendSuccess<T>(
  res: Response,
  data: T,
  meta?: { cached?: boolean; requestId?: string },
  statusCode = 200
): void {
  const payload: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      cached: meta?.cached ?? false,
      requestId: meta?.requestId,
    },
  };
  res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  requestId?: string,
  details?: unknown
): void {
  const payload: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      requestId,
      ...(details ? { details } : {}),
    },
  };
  res.status(statusCode).json(payload);
}
