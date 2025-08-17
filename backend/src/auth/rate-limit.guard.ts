import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private requestCounts = new Map<
    string,
    { count: number; resetTime: number }
  >();

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const clientId = this.getClientId(request);

    // Get rate limit configuration from decorator or use defaults
    const rateLimitConfig = this.reflector.get<RateLimitConfig>(
      'rateLimit',
      context.getHandler(),
    ) || {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100, // 100 requests per window
    };

    return this.checkRateLimit(clientId, rateLimitConfig);
  }

  private getClientId(request: any): string {
    // Use user ID if authenticated, otherwise use IP address
    const userId = request.user?.id || request.user?.sub;
    if (userId) {
      return `user:${userId}`;
    }

    // Fallback to IP address
    const ip = request.ip || request.connection.remoteAddress || 'unknown';
    return `ip:${ip}`;
  }

  private checkRateLimit(clientId: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const clientData = this.requestCounts.get(clientId);

    // Initialize or reset if window has passed
    if (!clientData || now > clientData.resetTime) {
      this.requestCounts.set(clientId, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return true;
    }

    // Check if limit exceeded
    if (clientData.count >= config.maxRequests) {
      throw new HttpException(
        'Rate limit exceeded. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment count
    clientData.count++;
    return true;
  }

  // Clean up old entries periodically
  private cleanup(): void {
    const now = Date.now();
    for (const [clientId, data] of this.requestCounts.entries()) {
      if (now > data.resetTime) {
        this.requestCounts.delete(clientId);
      }
    }
  }
}

// Decorator for custom rate limits
export const RateLimit = (config: RateLimitConfig) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('rateLimit', config, descriptor.value);
    return descriptor;
  };
};
