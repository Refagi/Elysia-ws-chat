import { Elysia, error, type Context, t, type Static } from 'elysia';
import { Logger } from './logger';
import { ErrorHandler } from '../middlewares/error-handler';
import { ApiError } from '../utils/ApiError';
import httpStatus from 'http-status';

const BaseResponseSchema = t.Object({
  path: t.String(),
  message: t.String(),
  timeStamp: t.String()
});

export const SuccessResponseSchema = t.Composite([
  BaseResponseSchema,
  t.Object({
    data: t.Any(),
    status: t.Union([t.Number(), t.String()])
  })
]);

export type SuccessResponse = Static<typeof SuccessResponseSchema>;

export class LoggerHandler {
  private logger;
  private errorHandler;

  constructor() {
    const loggerInstance = new Logger();
    this.logger = loggerInstance.getInstance();
    this.errorHandler = new ErrorHandler();
  }

  handleLogging() {
    return (app: Elysia) =>
      app
        // Log incoming request
        // .onRequest(({ request, set }) => {
        //   this.logger.info({
        //     method: request.method,
        //     url: request.url,
        //     status: set.status
        //   }, 'Incoming request');
        // })

        .onAfterResponse(async (context): Promise<SuccessResponse> => {
          const path = context.request.url;
          const message = 'success';
          const response = context.response;
          const timeStamp = new Date().toISOString();
          const status = context.set.status ?? 200;

          this.logger.info({path, status, timeStamp}, message)

          return {
            path,
            message,
            data: response,
            timeStamp,
            status
          };
        })

        .onError(({ error, request, set }) => {
          return this.errorHandler.errorHandler(error, set);
        });
  }
}
