import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
  HttpStatus,
} from '@nestjs/common';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp?: string;
  path?: string;
  code?: string;
  details?: any;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const timestamp = new Date().toISOString();
    const path = request?.url;

    // Handle HTTP exceptions (thrown by NestJS)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      // Log with appropriate level based on status code
      if (status >= 500) {
        this.logger.error(`HttpException ${status}`, { 
          exceptionResponse, 
          path,
          method: request?.method,
          headers: request?.headers,
        });
      } else if (status >= 400) {
        this.logger.warn(`HttpException ${status}`, { 
          exceptionResponse,
          path,
          method: request?.method,
        });
      }

      // Format the response
      const errorResponse: ErrorResponse = typeof exceptionResponse === 'string'
        ? { 
            statusCode: status,
            message: exceptionResponse,
            timestamp,
            path,
          }
        : {
            ...(exceptionResponse as object),
            statusCode: status,
            message: (exceptionResponse as any).message || 'Unknown error',
            timestamp,
            path,
          };

      response.status(status).json(errorResponse);
      return;
    }

    // Handle other types of errors
    const error = exception as Error;
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    
    // Log the error with stack trace
    this.logger.error('Unhandled exception', {
      error: error.message,
      stack: error.stack,
      path,
      method: request?.method,
      headers: request?.headers,
    });

    // Determine if we're in production to avoid leaking sensitive info
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Check for specific error types
    let errorCode = '';
    if (error.message?.includes('user creation failed') || 
        error.message?.includes('Failed to create user')) {
      errorCode = 'user_creation_failed';
    } else if (error.message?.includes('email already exists')) {
      errorCode = 'email_already_exists';
    } else if (error.message?.includes('Missing required email')) {
      errorCode = 'missing_email';
    } else if (error.message?.includes('Missing required portalId')) {
      errorCode = 'missing_portal_id';
    } else if (error.message?.includes('Missing token') || 
               error.message?.includes('Invalid token')) {
      errorCode = 'token_error';
    }
    
    // Create a standardized error response
    const errorResponse: ErrorResponse = {
      statusCode: status,
      message: isProduction ? 'Internal server error' : error.message || 'Unknown error',
      error: isProduction ? 'Internal Server Error' : error.name || 'Error',
      timestamp,
      path,
      // Include error code if available
      ...(errorCode ? { code: errorCode } : {}),
      // Include stack trace only in development
      ...(isProduction ? {} : { details: error.stack }),
    };

    response.status(status).json(errorResponse);
  }
}
