import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors.js';
import { sendError } from '../shared/response.js';
import { logger } from '../utils/logger.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const reqId = req.id ? String(req.id) : undefined;

  if (err instanceof AppError) {
    logger.warn({ reqId, code: err.code, message: err.message }, 'Application handled error');
    sendError(res, err.statusCode, err.code, err.message, reqId, err.details);
    return;
  }

  logger.error({ reqId, err: err.message, stack: err.stack }, 'Unhandled internal server error');
  sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'حدث خطأ داخلي غير متوقع في الخادم', reqId);
}

export function notFoundHandler(req: Request, res: Response): void {
  const reqId = req.id ? String(req.id) : undefined;
  sendError(res, 404, 'ROUTE_NOT_FOUND', `المسار المطلوب غير موجود: ${req.method} ${req.originalUrl}`, reqId);
}
