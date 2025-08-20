import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { 
  ValidationPipe, 
  ExecutionContext, 
  Injectable, 
  CallHandler, 
  SetMetadata,
  Inject
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';
import compression from 'compression';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { APP_INTERCEPTOR } from '@nestjs/core';

// Define cache key metadata constant
const CACHE_KEY_METADATA = 'cache_module:cache_key_metadata';

// Custom cache interceptor
@Injectable()
class HttpCacheInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly reflector: Reflector
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const key = this.trackBy(context);
    if (!key) {
      return next.handle();
    }

    try {
      // Try to get from cache first
      const cached = await this.cacheManager.get(key);
      if (cached) {
        return of(cached);
      }

      // If not in cache, proceed with the request and cache the response
      return next.handle().pipe(
        tap((data) => {
          const ttl = this.getTTL();
          this.cacheManager.set(key, data, ttl);
        })
      );
    } catch (error) {
      console.error('Cache error:', error);
      return next.handle();
    }
  }

  private trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const isGetRequest = method === 'GET';
    
    // Skip caching for non-GET requests
    if (!isGetRequest) {
      return undefined;
    }

    // Get user from request (set by auth middleware)
    const user = (request as any).user;
    const userId = user?.id || user?.sub || 'anonymous';
    
    // Generate cache key from request URL and user ID
    return `cache:${userId}:${method}:${url}`;
  }

  private getTTL(): number {
    // Default TTL of 5 minutes (in milliseconds)
    return 5 * 60 * 1000;
  }
}

// Polyfill for crypto.randomUUID if not available
if (!global.crypto) {
  (global as any).crypto = {
    randomUUID: () => randomUUID()
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: false, // We'll configure CORS manually below
    logger: ['error', 'warn', 'debug', 'log', 'verbose'],
  });

  // Set global prefix for all routes
  app.setGlobalPrefix('api');
  // Trust proxy for correct client IP and rate limiting behind Render/Cloudflare
  const httpAdapter = app.getHttpAdapter();
  if (httpAdapter.getType && httpAdapter.getType() === 'express') {
    const instance = httpAdapter.getInstance();
    if (instance && typeof instance.set === 'function') {
      instance.set('trust proxy', 1);
      // Disable ETag to prevent 304 Not Modified on dynamic JSON endpoints
      instance.set('etag', false);
    }
  }

  // Enhanced security middleware with optimized headers
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for now to fix TypeScript errors
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-site" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
    ieNoOpen: true,
      noSniff: true,
      referrerPolicy: { policy: 'same-origin' },
      xssFilter: true
    }),
  );

  // Add global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Setup global cache interceptor
  const reflector = app.get(Reflector);
  const cacheManager = app.get(CACHE_MANAGER);
  app.useGlobalInterceptors(
    new HttpCacheInterceptor(cacheManager, reflector)
  );

  // Enable shutdown hooks for graceful shutdown
  app.enableShutdownHooks();

  // Enable response compression with optimal settings
  app.use(compression({
    level: 6, // Compression level (0-9), 6 is a good balance
    threshold: '10kb', // Only compress responses larger than 10kb
    filter: (req, res) => {
      // Skip compression for certain content types
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
  }));

  // Configure rate limiting with different tiers
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 1000 : 5000, // Increased limit with better caching
    message: JSON.stringify({
      statusCode: 429,
      message: 'Too many requests, please try again later.',
      retryAfter: 15 * 60, // 15 minutes in seconds
    }),
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => {
      const forwardedFor = req.headers['x-forwarded-for'];
      const ip = (typeof forwardedFor === 'string' ? forwardedFor : req.ip) || '0.0.0.0';
      
      // Differentiate rate limiting for authenticated users
      const user = (req as any).user;
      const userId = user?.id || user?.sub || 'anonymous';
      return `${ip}:${userId}`;
    },
    // Add headers with rate limit information
    headers: true,
  });

  // Apply rate limiting to all routes (already prefixed with /api by setGlobalPrefix)
  app.use(apiLimiter);

  // Add cache control headers middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Add cache control headers
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Cache-Status', 'MISS');
    next();
  });

  // Specific rate limit for OAuth initiation only (not callback)
  const oauthLimiter = rateLimit({
    windowMs: 10 * 1000, // 10 seconds
    max: 3, // Allow 3 requests per 10 seconds for OAuth initiation
    message: 'Please wait before retrying the authentication process.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
    keyGenerator: (req) => {
      const forwardedFor = req.headers['x-forwarded-for'];
      return (
        ((typeof forwardedFor === 'string' ? forwardedFor : req.ip) ||
          '0.0.0.0') + ':oauth'
      );
    },
  });
  // Only apply rate limiting to OAuth initiation, not callback
  // Note: No need to include /api prefix here as it's handled by setGlobalPrefix
  app.use('/auth/hubspot/url', oauthLimiter);

  // Configure CORS with essential domains only
  app.enableCors({
    origin: (origin, callback) => {
      // Essential domains that need CORS access
      const allowedOrigins = [
        'https://www.workflowguard.pro',  // Main production domain
        'https://workflowguard.pro',      // Non-www version
        'http://localhost:5173',          // Local development (Vite/React)
        'http://localhost:3000',          // Local development (React/Next.js)
        'https://api.workflowguard.pro'   // API domain
      ];

      // Allow all origins in development
      if (process.env.NODE_ENV !== 'production') {
        console.log(`🌐 CORS: Allowing all origins in development`);
        return callback(null, true);
      }

      console.log(`🌐 CORS Check - Origin: ${origin || 'no-origin'}, Environment: ${process.env.NODE_ENV}`);

      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        console.log('✅ CORS: Allowing request with no origin');
        return callback(null, true);
      }

      // Check if origin is in allowed list or is a subdomain of allowed domains
      const isAllowed = allowedOrigins.some(allowedOrigin => 
        origin === allowedOrigin || 
        (origin.startsWith('http://') && origin.endsWith(allowedOrigin.replace(/^https?:\/\//, ''))) ||
        (origin.startsWith('https://') && origin.endsWith(allowedOrigin.replace(/^https?:\/\//, '')))
      );

      if (isAllowed) {
        console.log(`✅ CORS: Allowing origin ${origin}`);
        callback(null, true);
      } else {
        console.log(`❌ CORS: Blocking origin ${origin}`);
        console.log(`📋 Allowed origins: ${allowedOrigins.join(', ')}`);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-user-id',
      'x-hubspot-signature',
      'x-hubspot-request-timestamp',
      'x-hubspot-portal-id',
      'Accept',
      'Origin',
      'X-Requested-With',
      'cache-control',
    ],
    exposedHeaders: [
      'Content-Length',
      'X-Requested-With',
      'X-Marketplace-App',
      'X-Marketplace-Version',
    ],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Add request logging middleware with marketplace support
  app.use((req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || '');
        // Add user to request with proper type assertion
        const userPayload = payload as Record<string, any>;
        (req as any).user = {
          id: userPayload.sub || userPayload.id || 'anonymous',
          sub: userPayload.sub,
          email: userPayload.email,
          name: userPayload.name,
          role: userPayload.role
        };
      } catch (error) {
        // Token verification failed, continue without user
        console.error('Token verification failed:', error);
      }
    }
    const timestamp = new Date().toISOString();
    const origin = req.headers.origin || 'no-origin';
    const isMarketplaceRequest =
      req.url.includes('/hubspot-marketplace') ||
      req.headers['x-hubspot-signature'] ||
      req.headers['x-hubspot-portal-id'];
    const referrer = req.headers.referer || 'no-referrer';

    console.log(
      `${timestamp} - ${req.method} ${req.url} - Origin: ${origin} - Referrer: ${referrer}${isMarketplaceRequest ? ' [MARKETPLACE]' : ''}`,
    );

    next();
  });

  // Throttler module is not installed, using rate limiting middleware instead
  console.log('Rate limiting is enabled via express-rate-limit middleware');

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api`);
  console.log(
    `🏪 HubSpot Marketplace endpoints: http://localhost:${port}/api/hubspot-marketplace`,
  );
}

bootstrap();
