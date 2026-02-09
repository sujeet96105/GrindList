import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = isHttpException
      ? exception.getResponse()
      : { message: 'Internal server error' };

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : Array.isArray((exceptionResponse as { message?: string[] }).message)
          ? (exceptionResponse as { message: string[] }).message.join(', ')
          : (exceptionResponse as { message?: string }).message ?? 'Internal server error';

    const logPayload: Record<string, unknown> = {
      level: 'error',
      statusCode: status,
      method: request.method,
      path: request.url,
      message,
      requestId: request.headers['x-request-id'],
    };

    if (
      process.env.NODE_ENV !== 'production' &&
      exception instanceof Error &&
      exception.stack
    ) {
      logPayload.stack = exception.stack;
    }

    this.logger.error(JSON.stringify(logPayload));

    const responseMessage =
      process.env.NODE_ENV === 'production' && !isHttpException
        ? 'Internal server error'
        : message;

    response.status(status).json({
      statusCode: status,
      message: responseMessage,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
