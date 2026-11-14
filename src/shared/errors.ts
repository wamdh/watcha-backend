export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'المورد المطلوب غير موجود', details?: unknown) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'بيانات الطلب غير صالحة', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class UpstreamError extends AppError {
  constructor(message = 'فشل الاتصال بمزود البيانات الخارجي', details?: unknown) {
    super(message, 502, 'UPSTREAM_ERROR', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'غير مصرح بالوصول', details?: unknown) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}
