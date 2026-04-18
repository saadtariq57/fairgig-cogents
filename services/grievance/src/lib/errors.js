export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (msg, details) => new AppError(400, 'VALIDATION_ERROR', msg, details);
export const unauthorized = (msg = 'Unauthenticated') => new AppError(401, 'UNAUTHENTICATED', msg);
export const forbidden = (msg = 'Wrong role') => new AppError(403, 'FORBIDDEN', msg);
export const notFound = (msg = 'Not found') => new AppError(404, 'NOT_FOUND', msg);
export const conflict = (msg) => new AppError(409, 'CONFLICT', msg);
