export enum ErrorCode {
  // Auth & User Errors
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  PHONE_ALREADY_EXISTS = 'PHONE_ALREADY_EXISTS',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',

  // Passkey / WebAuthn Errors
  PASSKEY_NOT_FOUND = 'PASSKEY_NOT_FOUND',
  PASSKEY_ALREADY_EXISTS = 'PASSKEY_ALREADY_EXISTS',
  PASSKEY_VERIFICATION_FAILED = 'PASSKEY_VERIFICATION_FAILED',

  // Validation & Input
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELDS = 'MISSING_REQUIRED_FIELDS',
  INVALID_INPUT = 'INVALID_INPUT',

  // Resource Errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',

  // Server & System
  SERVER_ERROR = 'SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

export const ErrorHttpStatus: Record<ErrorCode, number> = {
  // Auth & User Errors
  [ErrorCode.USER_NOT_FOUND]: 404,
  [ErrorCode.USER_ALREADY_EXISTS]: 409, // Conflict
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.EMAIL_ALREADY_EXISTS]: 409,
  [ErrorCode.PHONE_ALREADY_EXISTS]: 409,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,

  // Passkey / WebAuthn
  [ErrorCode.PASSKEY_NOT_FOUND]: 404,
  [ErrorCode.PASSKEY_ALREADY_EXISTS]: 409,
  [ErrorCode.PASSKEY_VERIFICATION_FAILED]: 400,

  // Validation
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELDS]: 400,
  [ErrorCode.INVALID_INPUT]: 400,

  // Resource
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: 409,

  // Server
  [ErrorCode.SERVER_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
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
