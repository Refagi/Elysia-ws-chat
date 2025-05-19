// utils/CatchAllError.ts
import { ApiError } from './ApiError';
import httpStatus from 'http-status';

export function CatchAllError<T extends { new (...args: any[]): {} }>(target: T): T {
  return class extends target {
    [key: string]: unknown;
    constructor(...args: any[]) {
      super(...args);
      const methodNames = Object.getOwnPropertyNames(target.prototype).filter(
        (key) => key !== 'constructor' && typeof target.prototype[key] === 'function'
      );

      methodNames.forEach((methodName) => {
        const originalMethod = this[methodName] as Function;

        this[methodName] = async (...args: any[]) => {
          try {
            return await originalMethod.apply(this, ...args);
          } catch (error) {
            console.error(`Error in ${methodName}:`, error);
            if (error instanceof ApiError) {
              throw error; // Pertahankan ApiError asli
            }
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, (error as Error).message || 'Internal Server Error');
          }
        };
      });
    }
  };
}
