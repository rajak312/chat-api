export enum ErrorCode {
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  PASSKEY_NOT_FOUND = 'PASSKEY_NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
}

export const ErrorHttpStatus: Record<ErrorCode, number> = {
  [ErrorCode.USER_NOT_FOUND]: 404,
  [ErrorCode.PASSKEY_NOT_FOUND]: 404,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.SERVER_ERROR]: 500,
};

export class AppError extends Error {
  code: ErrorCode;
  status: number;
  constructor(message: string, code: ErrorCode) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = ErrorHttpStatus[code];
  }
}
