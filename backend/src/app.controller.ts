import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';
import { Public } from './auth/public.decorator';
import { PrismaService } from './prisma/prisma.service';
import { SkipThrottle } from '@nestjs/throttler';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @SkipThrottle()
  @Get('health')
  async healthCheck(@Res() res: Response) {
    try {
      // Basic health check - can be extended with database connectivity, etc.
      const healthStatus = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
      };

      res.status(HttpStatus.OK).json(healthStatus);
    } catch (error) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  }

  @Public()
  @Get('ready')
  async readinessCheck(@Res() res: Response) {
    try {
      // Check database connectivity
      let dbStatus = 'ok';
      try {
        await this.prisma.$queryRaw`SELECT 1`;
      } catch (dbError) {
        dbStatus = 'error';
        console.error('Database connectivity check failed:', dbError);
      }

      // Check HubSpot API connectivity (basic check)
      let hubspotStatus = 'ok';
      try {
        // Basic check - could be enhanced with actual HubSpot API call
        if (!process.env.HUBSPOT_CLIENT_ID || !process.env.HUBSPOT_CLIENT_SECRET) {
          hubspotStatus = 'warning';
        }
      } catch (hubspotError) {
        hubspotStatus = 'error';
        console.error('HubSpot configuration check failed:', hubspotError);
      }

      const readinessStatus = {
        status: dbStatus === 'ok' && hubspotStatus !== 'error' ? 'ready' : 'not_ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: dbStatus,
          hubspot: hubspotStatus,
        },
      };

      const statusCode = readinessStatus.status === 'ready' 
        ? HttpStatus.OK 
        : HttpStatus.SERVICE_UNAVAILABLE;

      res.status(statusCode).json(readinessStatus);
    } catch (error) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  }
}
