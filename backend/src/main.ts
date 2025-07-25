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

// Winston logger setup
const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug', // Reduce logging in production
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  transports: [
    new transports.Console(),
    // You can add file transports here for persistent logs
  ],
});

// Middleware to log all requests (only in development)
function requestLogger(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`HTTP ${req.method} ${req.url}`, {
      method: req.method,
      url: req.url,
      headers: req.headers,
      ip: req.ip,
    });
  }
  next();
}

// Exported for Vercel serverless handler
export async function createNestServer() {
  const server = express();
  server.use(requestLogger);
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(server),
  );

  // Helmet for security headers
  app.use(helmet());

  // Add timeout middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Set timeout for all requests
    req.setTimeout(30000); // 30 seconds
    res.setTimeout(30); // 30 seconds
    next();
  });

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('WorkflowGuard API')
    .setDescription('API documentation for WorkflowGuard')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api/docs', app, document);

  // Health check endpoint
  server.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Serve static files from the 'public' directory
  app.useStaticAssets(join(__dirname, '..', 'public'));

  app.use(compression());

  // Add caching headers for static content
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (
      req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)
    ) {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    } else if (req.path.match(/\.html$/)) {
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
    }
    next();
  });

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // CORS configuration
  const allowedOrigins = [
    'https://www.workflowguard.pro',
    'http://localhost:3000',
  ];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
    ],
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  app.setGlobalPrefix('api');

  await app.init();

  // Route logging after app.init
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const server: any = app.getHttpServer();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const router: any = server._events?.request?._router;
    if (router && router.stack) {
      console.log('Registered routes after app.init:');
      router.stack.forEach((layer: any) => {
        if (layer.route) {
          const path = layer.route.path;
          const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
          console.log(`${methods} ${path}`);
        }
      });
    }
  } catch (e) {
    console.error('Error logging routes:', e);
  }

  // Root health route (must come BEFORE the catch-all)
  server.get('/', (req, res) => {
    res.json({ message: 'WorkflowGuard API is running!' });
  });

  // Catch-all for SPA (must come LAST)
  server.get('*', (req, res) => {
    if (!req.originalUrl.startsWith('/api')) {
      res.sendFile(join(__dirname, '..', 'public', 'index.html'));
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
      console.log('🚀 Starting WorkflowGuard API...');
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(
        `🔗 Frontend URL: ${process.env.FRONTEND_URL || 'https://workflowguard-app.onrender.com'}`,
      );
      // Check if DATABASE_URL is set
      if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL environment variable is not set!');
        console.error(
          'Please set the DATABASE_URL environment variable in your Render dashboard.',
        );
        process.exit(1);
      }
      console.log(
        '🔌 Database URL configured:',
        process.env.DATABASE_URL ? 'Yes' : 'No',
      );
      if (process.env.SENTRY_DSN && process.env.NODE_ENV !== 'development') {
        Sentry.init({
          dsn: process.env.SENTRY_DSN,
          tracesSampleRate: 0.1,
          environment: process.env.NODE_ENV,
        });
      }
      const app = await NestFactory.create<NestExpressApplication>(AppModule);
      // Swagger setup
      const config = new DocumentBuilder()
        .setTitle('WorkflowGuard API')
        .setDescription('API documentation for WorkflowGuard')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('/api/docs', app, document);
      // Serve static files from the 'public' directory
      app.useStaticAssets(join(__dirname, '..', 'public'));

      app.use(
        helmet({
          contentSecurityPolicy: {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              scriptSrc: ["'self'"],
              imgSrc: ["'self'", 'data:', 'https:'],
            },
          },
        }),
      );

      app.use(compression());

      // Add caching headers for static content
      app.use((req: Request, res: Response, next: NextFunction) => {
        if (
          req.path.match(
            /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/,
          )
        ) {
          res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
        } else if (req.path.match(/\.html$/)) {
          res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
        }
        next();
      });

      const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
      });
      app.use(limiter);

      // CORS configuration
      const allowedOrigins = [
        'https://www.workflowguard.pro',
        'http://localhost:3000',
      ];
      app.enableCors({
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-Requested-With',
          'Accept',
        ],
      });

      app.use(cookieParser());

      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
        }),
      );

      app.useGlobalFilters(new AllExceptionsFilter());

      app.setGlobalPrefix('api');

      const port = process.env.PORT || 3000;
      await app.listen(port);

      // Route logging after app.listen
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const server: any = app.getHttpServer();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const router: any = server._events?.request?._router;
        if (router && router.stack) {
          console.log('Registered routes after app.listen:');
          router.stack.forEach((layer: any) => {
            if (layer.route) {
              const path = layer.route.path;
              const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
              console.log(`${methods} ${path}`);
            }
          });
        }
      } catch (e) {
        console.error('Error logging routes:', e);
      }

      // Catch-all route to serve index.html for SPA support (non-API routes)
      const expressApp = app.getHttpAdapter().getInstance();
      expressApp.get('*', (req, res) => {
        if (!req.originalUrl.startsWith('/api')) {
          res.sendFile(join(__dirname, '..', 'public', 'index.html'));
        }
      });

      console.log(`✅ WorkflowGuard API running on port ${port}`);
      console.log(`🌐 Server URL: http://localhost:${port}`);
      console.log(`📡 API Base URL: http://localhost:${port}/api`);
    } catch (error) {
      console.error('❌ Failed to start WorkflowGuard API:', error);
      if (error && error.stack) {
        console.error('Error stack:', error.stack);
      }
      // Log all environment variables for debugging (remove sensitive info in production)
      console.error('Environment variables:', JSON.stringify(process.env, null, 2));
      if (error.message?.includes("Can't reach database server")) {
        console.error('🔌 Database Connection Error:');
        console.error('   - Check if your DATABASE_URL is correct');
        console.error('   - Ensure your Supabase database is running');
        console.error('   - Verify network connectivity');
        console.error('   - Check if the database credentials are valid');
      }
      process.exit(1);
    }
  }

  bootstrap().catch((error) => {
    console.error('❌ Bootstrap failed:', error);
    process.exit(1);
  });
}

// Log unhandled errors
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});
