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
  BAD_REQUEST = 'BAD_REQUEST',

  // Resource Errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  CONNECTION_NOT_FOUND = 'CONNECTION_NOT_FOUND',

  // WebSocket / Realtime Errors
  WS_NOT_CONNECTED = 'WS_NOT_CONNECTED',

  // Server & System
  SERVER_ERROR = 'SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // common
  NOT_FOUND = 'NOT_FOUND',
}

export const ErrorHttpStatus: Record<ErrorCode, number> = {
  // Auth & User Errors
  [ErrorCode.USER_NOT_FOUND]: 404,
  [ErrorCode.USER_ALREADY_EXISTS]: 409,
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.EMAIL_ALREADY_EXISTS]: 409,
  [ErrorCode.PHONE_ALREADY_EXISTS]: 409,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,

  // Passkey / WebAuthn
  [ErrorCode.PASSKEY_NOT_FOUND]: 404,
  [ErrorCode.PASSKEY_ALREADY_EXISTS]: 409,
  [ErrorCode.PASSKEY_VERIFICATION_FAILED]: 400,

  // Validation & Input
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELDS]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.BAD_REQUEST]: 400,

  // Resource Errors
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: 409,
  [ErrorCode.CONNECTION_NOT_FOUND]: 404,

  // WebSocket / Realtime
  [ErrorCode.WS_NOT_CONNECTED]: 400,

  // Server & System
  [ErrorCode.SERVER_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,

  //not-found
  [ErrorCode.NOT_FOUND]: 404,
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
