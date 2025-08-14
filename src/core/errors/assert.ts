import { AppError, ErrorCode } from './app-error';

export function assert<T>(
  value: T,
  message: string,
  code: ErrorCode,
): asserts value is NonNullable<T> {
  if (value === null || value === undefined || value === false) {
    throw new AppError(message, code);
  }
}
