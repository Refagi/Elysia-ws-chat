export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  constructor(statusCode: number, message: string, isOperasional: boolean = true, stack?: string) {
    super(message), (this.statusCode = statusCode), (this.isOperational = isOperasional);
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}