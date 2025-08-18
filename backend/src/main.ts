import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import compression from 'compression';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { MarketplaceExceptionFilter } from './guards/marketplace-error.guard';

// Polyfill for crypto.randomUUID if not available
if (!global.crypto) {
  global.crypto = {
    randomUUID: () => randomUUID(),
  } as any;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: false, // We'll configure CORS manually below
    logger: ['error', 'warn', 'debug', 'log', 'verbose'],
  });
  // Trust proxy for correct client IP and rate limiting behind Render/Cloudflare
  const httpAdapter = app.getHttpAdapter();
  if (httpAdapter.getType && httpAdapter.getType() === 'express') {
    const instance = httpAdapter.getInstance();
    if (instance && typeof instance.set === 'function') {
      instance.set('trust proxy', 1);
    }
  }

  // Enhanced security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            'https://app.hubspot.com',
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://fonts.googleapis.com',
          ],
          imgSrc: ["'self'", 'data:', 'https:', 'http:'],
          connectSrc: [
            "'self'",
            'https://api.workflowguard.pro',
            'https://app.hubspot.com',
          ],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          objectSrc: ["'none'"],
          mediaSrc: ["'none'"],
          frameSrc: ["'self'", 'https://app.hubspot.com'],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );
  app.use(compression());

  // Production-grade rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 300 : 1000, // Stricter limit for production
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false, // Count successful requests against the limit
    keyGenerator: (req) => {
      // Use X-Forwarded-For header if behind proxy, otherwise use IP
      const forwardedFor = req.headers['x-forwarded-for'];
      return (
        (typeof forwardedFor === 'string' ? forwardedFor : req.ip) || '0.0.0.0'
      );
    },
  });
  app.use(limiter);

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
  app.use('/api/auth/hubspot/url', oauthLimiter);

  // Configure CORS properly to handle credentials - Enhanced for production
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'https://www.workflowguard.pro',
        'https://workflowguard.pro',
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
        'https://app.hubspot.com',
        'https://developers.hubspot.com',
        'https://marketplace.hubspot.com',
      ];

      console.log(`🌐 CORS Check - Origin: ${origin || 'no-origin'}, Environment: ${process.env.NODE_ENV}`);

      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        console.log('✅ CORS: Allowing request with no origin');
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
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

  // Additional CORS middleware as fallback for production
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      'https://www.workflowguard.pro',
      'https://workflowguard.pro',
      'http://localhost:5173',
      'http://localhost:3000',
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin || '*');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-user-id,x-hubspot-signature,x-hubspot-request-timestamp,x-hubspot-portal-id,Accept,Origin,X-Requested-With');
      res.header('Access-Control-Expose-Headers', 'Content-Length,X-Requested-With,X-Marketplace-App,X-Marketplace-Version');
    }

    if (req.method === 'OPTIONS') {
      console.log(`🔄 CORS Preflight: ${req.method} ${req.url} from ${origin}`);
      return res.status(204).end();
    }

    next();
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Enable ValidationPipe for production
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Register global exception filter with marketplace support
  app.useGlobalFilters(new AllExceptionsFilter());

  // Add request logging middleware with marketplace support
  app.use((req: Request, res: Response, next: NextFunction) => {
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

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api`);
  console.log(
    `🏪 HubSpot Marketplace endpoints: http://localhost:${port}/api/hubspot-marketplace`,
  );
}

bootstrap();
