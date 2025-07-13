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

// Exported for Vercel serverless handler
export async function createNestServer() {
  const server = express();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, new ExpressAdapter(server));

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

  app.enableCors({
    origin: [
      'https://workflowguard-app.onrender.com',
      'http://localhost:3000',
      'http://localhost:8080',
      process.env.FRONTEND_URL
    ].filter((v): v is string => typeof v === 'string'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.useGlobalFilters(new AllExceptionsFilter());

  app.setGlobalPrefix('api');

  // Catch-all route to serve index.html for SPA support (non-API routes)
  server.get('*', (req, res) => {
    if (!req.originalUrl.startsWith('/api')) {
      res.sendFile(join(__dirname, '..', 'public', 'index.html'));
    }
  });

  await app.init();
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
    
    try {
      const app = await NestFactory.create<NestExpressApplication>(AppModule);
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
      
      app.enableCors({
        origin: [
          'https://workflowguard-app.onrender.com',
          'http://localhost:3000',
          'http://localhost:8080',
          process.env.FRONTEND_URL
        ].filter((v): v is string => typeof v === 'string'),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      });
      
      app.use(cookieParser());
      
      app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }));
      
      app.useGlobalFilters(new AllExceptionsFilter());
      
      app.setGlobalPrefix('api');
      
      // Catch-all route to serve index.html for SPA support (non-API routes)
      const expressApp = app.getHttpAdapter().getInstance();
      expressApp.get('*', (req, res) => {
        if (!req.originalUrl.startsWith('/api')) {
          res.sendFile(join(__dirname, '..', 'public', 'index.html'));
        }
      });
      
      const port = process.env.PORT || 3000;
      await app.listen(port);
      
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
