import { Controller, Get, HttpStatus, Res, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { Response, Request } from 'express';
import { Public } from './auth/public.decorator';
import { PrismaService } from './prisma/prisma.service';
import { SkipThrottle } from '@nestjs/throttler';
import { Logger, createLogger, format, transports } from 'winston';
import * as client from 'prom-client';

// Winston logger setup
const logger: Logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

// Prometheus metrics setup
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Get()
  getHello() {
    return { message: 'WorkflowGuard API is running!' };
  }

  @Public()
  @SkipThrottle()
  @Get('metrics')
  async metrics(@Res() res: Response) {
    try {
      res.set('Content-Type', client.register.contentType);
      res.end(await client.register.metrics());
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
    }
  }

  @Public()
  @SkipThrottle()
  @Get('health')
  async healthCheck(@Req() req: Request, @Res() res: Response) {
    try {
      const healthStatus = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
      };
      logger.info('Health check successful', healthStatus);
      httpRequestCounter.inc({
        method: req.method,
        route: '/health',
        status: HttpStatus.OK,
      });
      res.status(HttpStatus.OK).json(healthStatus);
    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      httpRequestCounter.inc({
        method: req.method,
        route: '/health',
        status: HttpStatus.SERVICE_UNAVAILABLE,
      });
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  }

  @Public()
  @Get('ready')
  async readinessCheck(@Req() req: Request, @Res() res: Response) {
    try {
      let dbStatus = 'ok';
      try {
        await this.prisma.$queryRaw`SELECT 1`;
      } catch (dbError) {
        dbStatus = 'error';
        logger.error('Database connectivity check failed', {
          error: dbError.message,
        });
      }
      let hubspotStatus = 'ok';
      try {
        if (
          !process.env.HUBSPOT_CLIENT_ID ||
          !process.env.HUBSPOT_CLIENT_SECRET
        ) {
          hubspotStatus = 'warning';
        }
      } catch (hubspotError) {
        hubspotStatus = 'error';
        logger.error('HubSpot configuration check failed', {
          error: hubspotError.message,
        });
      }
      const readinessStatus = {
        status:
          dbStatus === 'ok' && hubspotStatus !== 'error'
            ? 'ready'
            : 'not_ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: dbStatus,
          hubspot: hubspotStatus,
        },
      };
      logger.info('Readiness check', readinessStatus);
      const statusCode =
        readinessStatus.status === 'ready'
          ? HttpStatus.OK
          : HttpStatus.SERVICE_UNAVAILABLE;
      httpRequestCounter.inc({
        method: req.method,
        route: '/ready',
        status: statusCode,
      });
      res.status(statusCode).json(readinessStatus);
    } catch (error) {
      logger.error('Readiness check failed', { error: error.message });
      httpRequestCounter.inc({
        method: req.method,
        route: '/ready',
        status: HttpStatus.SERVICE_UNAVAILABLE,
      });
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  }

  @Public()
  @Get('test-monitored-workflows')
  async testMonitoredWorkflows(@Res() res: Response) {
    try {
      // Test if MonitoredWorkflow table exists
      try {
        await this.prisma.$queryRaw`SELECT 1 FROM "MonitoredWorkflow" LIMIT 1`;
        res.status(HttpStatus.OK).json({
          status: 'ok',
          message: 'MonitoredWorkflow table exists and is accessible',
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        res.status(HttpStatus.OK).json({
          status: 'error',
          message: 'MonitoredWorkflow table does not exist or is not accessible',
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to test monitored workflows',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
