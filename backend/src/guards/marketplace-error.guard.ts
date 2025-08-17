import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class MarketplaceErrorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Add marketplace-specific error handling
    this.setupMarketplaceErrorHandling(request, response);

    return true;
  }

  private setupMarketplaceErrorHandling(request: Request, response: Response) {
    // Override response methods to ensure marketplace-compatible error responses
    const originalJson = response.json;
    const originalStatus = response.status;

    response.json = function (data: any) {
      // Ensure marketplace-compatible response format
      if (data && typeof data === 'object') {
        // Add marketplace-specific headers
        response.setHeader('X-Marketplace-App', 'WorkflowGuard');
        response.setHeader('X-Marketplace-Version', '1.0.0');

        // Ensure error responses are marketplace-compatible
        if (data.error || data.message) {
          return originalJson.call(this, {
            success: false,
            error: data.error || data.message,
            code: data.code || 'MARKETPLACE_ERROR',
            timestamp: new Date().toISOString(),
            marketplace: {
              app: 'WorkflowGuard',
              version: '1.0.0',
            },
          });
        }
      }

      return originalJson.call(this, data);
    };

    response.status = function (code: number) {
      // Log marketplace-specific status codes
      if (code >= 400) {
        console.log('HubSpot Marketplace - Error response:', {
          status: code,
          url: request.url,
          method: request.method,
          userAgent: request.headers['user-agent'],
        });
      }

      return originalStatus.call(this, code);
    };
  }
}

/**
 * Marketplace-specific exception filter
 */
export class MarketplaceExceptionFilter {
  static handle(error: any, request: Request, response: Response) {
    console.error('HubSpot Marketplace - Exception caught:', {
      error: error.message,
      stack: error.stack,
      url: request.url,
      method: request.method,
      headers: request.headers,
    });

    // Determine if this is a marketplace request
    const isMarketplaceRequest = this.isMarketplaceRequest(request);

    if (isMarketplaceRequest) {
      return this.handleMarketplaceError(error, response);
    }

    // Handle regular errors
    return this.handleRegularError(error, response);
  }

  private static isMarketplaceRequest(request: Request): boolean {
    const marketplaceHeaders = [
      'x-hubspot-signature',
      'x-hubspot-request-timestamp',
      'x-hubspot-portal-id',
    ];

    return (
      marketplaceHeaders.some((header) => request.headers[header]) ||
      request.url.includes('/hubspot-marketplace') ||
      request.url.includes('/marketplace')
    );
  }

  private static handleMarketplaceError(error: any, response: Response) {
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'MARKETPLACE_ERROR';
    let message = 'An error occurred while processing your request';

    // Map specific errors to marketplace-compatible responses
    if (error instanceof HttpException) {
      statusCode = error.getStatus();

      switch (statusCode) {
        case HttpStatus.UNAUTHORIZED:
          errorCode = 'MARKETPLACE_AUTH_ERROR';
          message = 'Authentication required for marketplace access';
          break;
        case HttpStatus.FORBIDDEN:
          errorCode = 'MARKETPLACE_PERMISSION_ERROR';
          message = 'Insufficient permissions for marketplace operation';
          break;
        case HttpStatus.BAD_REQUEST:
          errorCode = 'MARKETPLACE_VALIDATION_ERROR';
          message = 'Invalid request parameters for marketplace';
          break;
        case HttpStatus.NOT_FOUND:
          errorCode = 'MARKETPLACE_RESOURCE_ERROR';
          message = 'Requested marketplace resource not found';
          break;
        case HttpStatus.TOO_MANY_REQUESTS:
          errorCode = 'MARKETPLACE_RATE_LIMIT_ERROR';
          message = 'Rate limit exceeded for marketplace requests';
          break;
        default:
          errorCode = 'MARKETPLACE_SERVER_ERROR';
          message = 'Marketplace service temporarily unavailable';
      }
    }

    // Return marketplace-compatible error response
    return response.status(statusCode).json({
      success: false,
      error: message,
      code: errorCode,
      timestamp: new Date().toISOString(),
      marketplace: {
        app: 'WorkflowGuard',
        version: '1.0.0',
        support: 'support@workflowguard.pro',
      },
      details:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }

  private static handleRegularError(error: any, response: Response) {
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (error instanceof HttpException) {
      statusCode = error.getStatus();
      message = error.message;
    }

    return response.status(statusCode).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Marketplace-specific validation pipe
 */
export class MarketplaceValidationPipe {
  static transform(value: any, metadata: any) {
    // Add marketplace-specific validation
    if (metadata.type === 'body') {
      return this.validateMarketplaceBody(value);
    }

    return value;
  }

  private static validateMarketplaceBody(body: any) {
    // Validate marketplace-specific fields
    if (body.portalId && typeof body.portalId !== 'string') {
      throw new HttpException(
        'Portal ID must be a string',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      body.planId &&
      !['starter', 'professional', 'enterprise'].includes(body.planId)
    ) {
      throw new HttpException('Invalid plan ID', HttpStatus.BAD_REQUEST);
    }

    return body;
  }
}

/**
 * Marketplace-specific logging interceptor
 */
export class MarketplaceLoggingInterceptor {
  static intercept(context: ExecutionContext, next: any) {
    const request = context.switchToHttp().getRequest<Request>();
    const isMarketplaceRequest = this.isMarketplaceRequest(request);

    if (isMarketplaceRequest) {
      console.log('HubSpot Marketplace - Request:', {
        method: request.method,
        url: request.url,
        portalId: request.headers['x-hubspot-portal-id'],
        timestamp: new Date().toISOString(),
      });
    }

    return next.handle();
  }

  private static isMarketplaceRequest(request: Request): boolean {
    return (
      request.url.includes('/hubspot-marketplace') ||
      !!request.headers['x-hubspot-signature'] ||
      !!request.headers['x-hubspot-portal-id']
    );
  }
}
