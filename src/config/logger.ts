import pino from 'pino';
import config from './config';
import type { ApiError } from '../utils/ApiError';

export class Logger {
  private logger;

  constructor() {
    this.logger = pino({
      level: config.env === 'development' ? 'debug' : 'info',
      transport: config.env === 'development' ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      } : undefined,
      formatters: {
        level(label) {
          return { level: label };
        },
        log(object) {
          if (object instanceof Error) {
            return { ...object, message: object.stack };
          }
          return object;
        }
      }
    });

  }

  debug(message: string, meta: Record<string, any> = {}) {
    this.logger.debug({ ...meta }, message);
  }

  info(message: string, meta: Record<string, any> = {}) {
    this.logger.info({ ...meta }, message);
  }

  warn(message: string, meta: Record<string, any> = {}) {
    this.logger.warn({ ...meta }, message);
  }

  error(error: Error | ApiError, meta: Record<string, any> = {}) {
    if (error instanceof Error) {
      this.logger.error({ ...meta, stack: error.stack }, error.message);
    } else {
      this.logger.error({ ...meta }, error);
    }
  }

  getInstance() {
    return this.logger;
  }
}