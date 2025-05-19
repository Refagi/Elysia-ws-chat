import { Elysia, NotFoundError, ValidationError } from 'elysia';
import type { Context } from 'elysia';
import { Logger } from '../config/logger';
import { ApiError } from '../utils/ApiError';
import httpStatus from 'http-status';
import { DrizzleError } from 'drizzle-orm';
import config from '../config/config';
import { ZodError } from 'zod';

export class ErrorHandler {
  private logger;

  constructor() {
    const loggerInstance = new Logger();
    this.logger = loggerInstance.getInstance();
  }

  errorConverter(error: any) {
    // console.error('🔥 Original Error: ', error);
    if (!(error instanceof ApiError)) {
      if (error.response) {
        const message = error.response.data?.message || error.response.data;
        const statusCode = error.response.status;

        this.logger.info('handleApiError');
        error = new ApiError(statusCode, message, false, error.stack);
      } else if (error instanceof ZodError) {
        error = new ApiError(httpStatus.BAD_REQUEST, error.message, false, error.stack);
      } else if (error instanceof NotFoundError) {
        error = new ApiError(httpStatus.NOT_FOUND, error.message || 'Not Found', false, error.stack);
      } else if (error instanceof DrizzleError) {
        this.logger.info('handleDrizzleError');
        error = this.handleDrizzleError(error);
      } else {
        const statusCode = error.statusCode ?? httpStatus.INTERNAL_SERVER_ERROR;
        const message = error.message ?? httpStatus[statusCode as keyof typeof httpStatus];
        error = new ApiError(statusCode, message, false, error.stack);
      }
    };
    return error;
  }

  handleDrizzleError = (err: DrizzleError): ApiError => {
    const errorMessage = err.message.toLowerCase();

    if (errorMessage.includes('unique constraint')) {
      // Menangani error duplicate (misalnya constraint unik)
      return new ApiError(httpStatus.BAD_REQUEST, 'Duplicate field value', false, err.stack);
    }
    if (errorMessage.includes('foreign key constraint')) {
      // Menangani error relasi foreign key
      return new ApiError(httpStatus.BAD_REQUEST, 'Invalid foreign key value', false, err.stack);
    }
    if (errorMessage.includes('not null constraint')) {
      // Menangani kolom yang wajib diisi (NOT NULL constraint)
      return new ApiError(httpStatus.BAD_REQUEST, 'Missing required field', false, err.stack);
    }
    // Default error
    return new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Something went wrong: ${err.message}`, false, err.stack);
  };

  errorHandler(error: unknown, set: Context['set']) {
    const convertedError = this.errorConverter(error);

    let { statusCode, message } = convertedError;
    if (config.env === 'production' && !convertedError.isOperational) {
      statusCode = httpStatus.INTERNAL_SERVER_ERROR;
      message = 'Something went wrong, please try again later.';
    }

    set.status = statusCode;

    if (config.env === 'development') {
      this.logger.error(convertedError);
    }

    return {
      code: statusCode,
      message,
      ...(config.env === 'development' && { stack: convertedError.stack })
    };
  }
}