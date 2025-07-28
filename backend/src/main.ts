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

// Winston logger setup
const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  transports: [
    new transports.Console(),
  ],
});

// Exported for Vercel serverless handler
export async function createNestServer() {
  const server = express();
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(server),
  );

  // Configure WebSocket adapter
  app.useWebSocketAdapter(new IoAdapter(app));

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

  // Root health route
  server.get('/', (req: Request, res: Response) => {
    res.json({ message: 'WorkflowGuard API is running!' });
  });

  // Catch-all for SPA
  server.get('*', (req: Request, res: Response) => {
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
      console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'https://www.workflowguard.pro'}`);

    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL environment variable is not set!');
      process.exit(1);
    }
      console.log('🔌 Database URL configured: Yes');

    // Fix production schema if needed
    if (process.env.NODE_ENV === 'production') {
      console.log('🔧 Running production schema fix...');
      try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        // Check if MonitoredWorkflow table exists and create it if needed
        try {
          await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS "MonitoredWorkflow" (
              "id" TEXT NOT NULL,
              "userId" TEXT NOT NULL,
              "workflowId" TEXT NOT NULL,
              "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY ("id")
            );
          `;
          console.log('✅ MonitoredWorkflow table created/verified');
        } catch (error) {
          console.log('⚠️ MonitoredWorkflow table already exists or error:', error.message);
        }

        // Add missing columns to Workflow table if they don't exist
        try {
          await prisma.$executeRaw`
            ALTER TABLE "Workflow" ADD COLUMN IF NOT EXISTS "autoSync" BOOLEAN DEFAULT true;
          `;
          console.log('✅ Added autoSync column to Workflow table');
        } catch (error) {
          console.log('⚠️ autoSync column already exists or error:', error.message);
        }

        try {
          await prisma.$executeRaw`
            ALTER TABLE "Workflow" ADD COLUMN IF NOT EXISTS "syncInterval" INTEGER DEFAULT 3600;
          `;
          console.log('✅ Added syncInterval column to Workflow table');
        } catch (error) {
          console.log('⚠️ syncInterval column already exists or error:', error.message);
        }

        try {
          await prisma.$executeRaw`
            ALTER TABLE "Workflow" ADD COLUMN IF NOT EXISTS "notificationsEnabled" BOOLEAN DEFAULT true;
          `;
          console.log('✅ Added notificationsEnabled column to Workflow table');
        } catch (error) {
          console.log('⚠️ notificationsEnabled column already exists or error:', error.message);
        }

        // Update WorkflowVersion table to rename versionNumber to version if needed
        try {
          const columns = await prisma.$queryRaw`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'WorkflowVersion' AND table_schema = 'public';
          `;
          
          const columnNames = columns.map((col: any) => col.column_name);
          const hasVersionNumber = columnNames.includes('versionNumber');
          const hasVersion = columnNames.includes('version');
          
          if (hasVersionNumber && !hasVersion) {
            await prisma.$executeRaw`
              ALTER TABLE "WorkflowVersion" RENAME COLUMN "versionNumber" TO "version";
            `;
            console.log('✅ Renamed versionNumber to version in WorkflowVersion table');
          } else if (hasVersion) {
            console.log('✅ Version column already exists in WorkflowVersion table');
          } else {
            // Add version column if neither exists
            await prisma.$executeRaw`
              ALTER TABLE "WorkflowVersion" ADD COLUMN "version" INTEGER;
            `;
            console.log('✅ Added version column to WorkflowVersion table');
          }
        } catch (error) {
          console.log('⚠️ WorkflowVersion table update error:', error.message);
        }

        // Add description column to WorkflowVersion if it doesn't exist
        try {
          await prisma.$executeRaw`
            ALTER TABLE "WorkflowVersion" ADD COLUMN IF NOT EXISTS "description" TEXT;
          `;
          console.log('✅ Added description column to WorkflowVersion table');
        } catch (error) {
          console.log('⚠️ description column already exists or error:', error.message);
        }

        await prisma.$disconnect();
        console.log('🎉 Production schema fix completed successfully!');
      } catch (error) {
        console.error('❌ Error fixing production schema:', error);
        // Don't exit, continue with startup
      }
    }

    if (process.env.SENTRY_DSN && process.env.NODE_ENV !== 'development') {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        tracesSampleRate: 0.1,
        environment: process.env.NODE_ENV,
      });
    }

      const app = await NestFactory.create<NestExpressApplication>(AppModule);

      // Configure WebSocket adapter for real-time features
      app.useWebSocketAdapter(new IoAdapter(app));

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
              imgSrc: ["'self'", 'data:', 'https:'],
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
      console.log(`🔌 Attempting to bind to port ${port}...`);
      
      await app.listen(port, '0.0.0.0');

      console.log(`✅ WorkflowGuard API running on port ${port}`);
      console.log(`🌐 Server URL: http://0.0.0.0:${port}`);
      console.log(`📡 API Base URL: http://0.0.0.0:${port}/api`);
      console.log(`🔌 WebSocket server enabled for real-time features`);

      // Keep the process alive
      process.on('SIGTERM', () => {
        console.log('SIGTERM received, shutting down gracefully');
        app.close();
      });

      process.on('SIGINT', () => {
        console.log('SIGINT received, shutting down gracefully');
        app.close();
      });

    } catch (error) {
      console.error('❌ Failed to start WorkflowGuard API:', error);
      if (error && error.stack) {
        console.error('Error stack:', error.stack);
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
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});