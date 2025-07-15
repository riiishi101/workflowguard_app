import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as compression from 'compression';
import helmet from 'helmet';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { rateLimit } from 'express-rate-limit';
import { AllExceptionsFilter } from './all-exceptions.filter';
import * as cookieParser from 'cookie-parser';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as Sentry from '@sentry/node';
import * as SentryIntegrations from '@sentry/integrations';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { createLogger, format, transports } from 'winston';
import { Request, Response, NextFunction } from 'express';

// Winston logger setup
const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    // You can add file transports here for persistent logs
  ],
});

// Middleware to log all requests
function requestLogger(req: Request, res: Response, next: NextFunction) {
  logger.info(`HTTP ${req.method} ${req.url}`, {
    method: req.method,
    url: req.url,
    headers: req.headers,
    ip: req.ip,
  });
  next();
}

// Exported for Vercel serverless handler
export async function createNestServer() {
  const server = express();
  server.use(requestLogger);
  const app = await NestFactory.create<NestExpressApplication>(AppModule, new ExpressAdapter(server));

  // Helmet for security headers
  app.use(helmet());

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

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // CORS configuration
  const allowedOrigins = (process.env.CORS_ORIGIN || 'https://workflowguard-app.vercel.app').split(',');
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  });

  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.useGlobalFilters(new AllExceptionsFilter());

  app.setGlobalPrefix('api');

  await app.init();

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
    console.log('🚀 Starting WorkflowGuard API...');
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'https://workflowguard-app.onrender.com'}`);
    
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL environment variable is not set!');
      console.error('Please set the DATABASE_URL environment variable in your Render dashboard.');
      process.exit(1);
    }
    
    console.log('🔌 Database URL configured:', process.env.DATABASE_URL ? 'Yes' : 'No');
    
    if (process.env.SENTRY_DSN && process.env.NODE_ENV !== 'development') {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        tracesSampleRate: 0.1,
        environment: process.env.NODE_ENV,
      });
    }
    
    try {
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
      
      app.use(helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
      }));
      
      app.use(compression());
      
      const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
      });
      app.use(limiter);
      
      // CORS configuration
      const allowedOrigins = (process.env.CORS_ORIGIN || 'https://workflowguard-app.vercel.app').split(',');
      app.enableCors({
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
      });
      
      app.use(cookieParser());
      
      app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }));
      
      app.useGlobalFilters(new AllExceptionsFilter());
      
      app.setGlobalPrefix('api');
      
      const port = process.env.PORT || 3000;
      await app.listen(port);
      
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
      
      if (error.message?.includes('Can\'t reach database server')) {
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
