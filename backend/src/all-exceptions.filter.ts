import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      this.logger.error('HttpException', exceptionResponse);
      response
        .status(status)
        .json(
          typeof exceptionResponse === 'string'
            ? { message: exceptionResponse }
            : exceptionResponse,
        );
      return;
    }

    this.logger.error('Unhandled exception', exception as any);
    response.status(500).json({
      statusCode: 500,
      timestamp: new Date().toISOString(),
      path: request?.url,
      message: 'Internal server error',
    });
  }
}
