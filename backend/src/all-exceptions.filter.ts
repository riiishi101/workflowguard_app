import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;

    this.logger.error('Unhandled exception', {
      exception,
      method: request?.method,
      url: request?.originalUrl || request?.url,
      headers: request?.headers,
      cookies: request?.cookies,
      body: request?.body,
      query: request?.query,
    });

    response.status(status).json({
      statusCode: status,
      message: status === 500 ? 'Internal server error' : (exception as any).message,
    });
  }
} 