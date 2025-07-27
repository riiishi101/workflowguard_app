import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as compression from 'compression';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { AllExceptionsFilter } from './all-exceptions.filter';
import * as cookieParser from 'cookie-parser';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as Sentry from '@sentry/node';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { createLogger, format, transports } from 'winston';
import { Request, Response, NextFunction } from 'express';
import { IoAdapter } from '@nestjs/platform-socket.io';

// Initialize Sentry for error tracking
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app: express() }),
    ],
  });
}

// Winston logger setup with production optimizations
const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    // Add file transport for production
    ...(process.env.NODE_ENV === 'production' ? [
      new transports.File({ 
        filename: 'logs/error.log', 
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      new transports.File({ 
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    ] : [])
  ],
  exitOnError: false,
});

// Exported for Vercel serverless handler
export async function createNestServer() {
  const server = express();
  
  // Initialize Sentry request handler
  if (process.env.SENTRY_DSN) {
    server.use(Sentry.Handlers.requestHandler());
  }

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(server),
    {
      logger: ['error', 'warn', 'log'],
      cors: true,
    }
  );

  // Configure WebSocket adapter with production settings
  const ioAdapter = new IoAdapter(app);
  ioAdapter.createIOServer = (port, options) => {
    const server = require('socket.io')(port, {
      ...options,
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',').filter(Boolean) || ['http://localhost:3000'],
        credentials: true,
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });
    return server;
  };
  app.useWebSocketAdapter(ioAdapter);

  // Enhanced Helmet configuration for production security
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "wss:", "ws:"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));

  // Swagger setup (only in development)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('WorkflowGuard API')
      .setDescription('API documentation for WorkflowGuard')
      .setVersion('1.0')
      .addBearerAuth()
      .addServer(process.env.API_URL || 'http://localhost:3000')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('/api/docs', app, document);
  }

  // Enhanced health check endpoint
  server.get('/health', (req, res) => {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      memory: process.memoryUsage(),
    };
    res.status(200).json(health);
  });

  // Serve static files from the 'public' directory
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    maxAge: '1y',
    etag: true,
    lastModified: true,
  });

  // Enhanced compression
  app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
  }));

  // Enhanced rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit each IP to 100 requests per windowMs in production
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: 15 * 60, // 15 minutes
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks and static assets
      return req.path === '/health' || req.path.startsWith('/static/');
    },
  });
  app.use(limiter);

  // Enhanced CORS configuration
  const allowedOrigins = process.env.CORS_ORIGIN?.split(',').filter(Boolean) || [
    'https://www.workflowguard.pro',
    'https://workflowguard.vercel.app',
    'http://localhost:3000',
  ];
  
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'X-API-Key',
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  });

  app.use(cookieParser());

  // Enhanced validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: process.env.NODE_ENV === 'production',
    })
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global prefix
  app.setGlobalPrefix('api');

  // Trust proxy for production
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  await app.init();

  // Sentry error handler (must be registered before any other error middleware)
  if (process.env.SENTRY_DSN) {
    server.use(Sentry.Handlers.errorHandler());
  }

  // Root health route
  server.get('/', (req: Request, res: Response) => {
    res.json({ 
      message: 'WorkflowGuard API is running!',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  // Enhanced 404 handler
  server.use('*', (req: Request, res: Response) => {
    if (req.originalUrl.startsWith('/api')) {
      res.status(404).json({
        error: 'API endpoint not found',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Serve SPA for non-API routes
      res.sendFile(join(__dirname, '..', 'public', 'index.html'));
    }
  });

  // Global error handler
  server.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Unhandled error:', error);
    
    if (process.env.NODE_ENV === 'production') {
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    }
  });

  return server;
}

// Also export as default for compatibility
export default createNestServer;

// Only run this for local/dev, not on Vercel
if (process.env.VERCEL !== '1') {
  async function bootstrap() {
    try {
      const server = await createNestServer();
      const port = process.env.PORT || 3000;
      
      server.listen(port, () => {
        logger.log(`🚀 WorkflowGuard API is running on port ${port}`);
        logger.log(`📊 Health check available at http://localhost:${port}/health`);
        if (process.env.NODE_ENV !== 'production') {
          logger.log(`📚 API docs available at http://localhost:${port}/api/docs`);
        }
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  bootstrap();
}

// Log unhandled errors
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});