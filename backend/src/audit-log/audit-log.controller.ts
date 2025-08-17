import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpException,
  HttpStatus,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AuditLogService } from './audit-log.service';
import { CreateAuditLogDto } from './dto';

import { UserService } from '../user/user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TrialGuard } from '../guards/trial.guard';

@Controller('audit-logs')
export class AuditLogController {
  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly userService: UserService,
  ) {}

  @Post()
  async create(@Body() createAuditLogDto: CreateAuditLogDto) {
    try {
      return await this.auditLogService.create(createAuditLogDto);
    } catch (error) {
      throw new HttpException(
        'Failed to create audit log',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, TrialGuard)
  async findAll(
    @Req() req: Request,
    @Query('userId') userId?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ) {
    try {
      // Extract user ID from JWT with multiple fallbacks
      const userIdFromJwt =
        (req.user as any)?.sub ||
        (req.user as any)?.id ||
        (req.user as any)?.userId;

      if (!userIdFromJwt) {
        console.error('User ID not found in JWT token:', req.user);
        throw new HttpException(
          'User authentication failed - no user ID found',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Only check subscription if we have a valid user ID
      const user =
        await this.userService.findOneWithSubscription(userIdFromJwt);
      if (!user) {
        console.error('User not found for ID:', userIdFromJwt);
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const planId = user?.subscription?.planId || 'starter';
      const plan =
        (await this.userService.getPlanById(planId)) ||
        (await this.userService.getPlanById('starter'));

      console.log('🔍 AUDIT LOG DEBUG:', {
        userId: userIdFromJwt,
        userEmail: user?.email,
        subscriptionPlanId: user?.subscription?.planId,
        fallbackPlanId: planId,
        planFeatures: plan?.features,
        hasAuditLogs: plan?.features?.includes('audit_logs'),
        planId: plan?.id,
        planName: plan?.name,
      });

      if (!plan?.features?.includes('audit_logs')) {
        console.error(
          'Plan does not include audit_logs feature:',
          planId,
          plan?.features,
        );
        throw new HttpException(
          'Audit log access is not available on your plan.',
          HttpStatus.FORBIDDEN,
        );
      }

      if (userId) {
        try {
          return await this.auditLogService.findByUser(userId);
        } catch (err) {
          console.error('Error in findByUser:', err);
          throw err;
        }
      }
      if (entityType && entityId) {
        try {
          return await this.auditLogService.findByEntity(entityType, entityId);
        } catch (err) {
          console.error('Error in findByEntity:', err);
          throw err;
        }
      }
      try {
        return await this.auditLogService.findAll();
      } catch (err) {
        console.error('Error in findAll (service):', err);
        throw err;
      }
    } catch (error) {
      console.error(
        'Error in findAll audit logs (controller):',
        error,
        error?.stack,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to fetch audit logs: ${error?.message || error}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, TrialGuard)
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const userIdFromJwt =
      (req.user as any)?.sub ||
      (req.user as any)?.id ||
      (req.user as any)?.userId;

    if (!userIdFromJwt) {
      throw new HttpException(
        'User authentication failed - no user ID found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = await this.userService.findOneWithSubscription(userIdFromJwt);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const planId = user?.subscription?.planId || 'starter';
    const plan =
      (await this.userService.getPlanById(planId)) ||
      (await this.userService.getPlanById('starter'));
    if (!plan?.features?.includes('audit_logs')) {
      throw new HttpException(
        'Audit log access is not available on your plan.',
        HttpStatus.FORBIDDEN,
      );
    }
    const auditLog = await this.auditLogService.findOne(id);
    if (!auditLog) {
      throw new HttpException('Audit log not found', HttpStatus.NOT_FOUND);
    }
    return auditLog;
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard, TrialGuard)
  async findByUser(@Req() req: Request, @Param('userId') userId: string) {
    let safeUserId = userId;
    if (!safeUserId) {
      safeUserId =
        (req.user as any)?.sub ||
        (req.user as any)?.id ||
        (req.user as any)?.userId;
    }
    if (!safeUserId) {
      const headerId = req.headers['x-user-id'];
      if (Array.isArray(headerId)) {
        safeUserId = headerId[0];
      } else if (typeof headerId === 'string') {
        safeUserId = headerId;
      }
    }
    if (!safeUserId || typeof safeUserId !== 'string') {
      throw new HttpException('User ID not found', HttpStatus.UNAUTHORIZED);
    }
    const user = await this.userService.findOneWithSubscription(safeUserId);
    const planId =
      user && user.subscription ? user.subscription.planId : 'starter';
    const plan =
      (await this.userService.getPlanById(planId)) ||
      (await this.userService.getPlanById('starter'));
    if (!plan?.features?.includes('audit_logs')) {
      throw new HttpException(
        'Audit log access is not available on your plan.',
        HttpStatus.FORBIDDEN,
      );
    }
    return await this.auditLogService.findByUser(safeUserId);
  }

  @Get('entity/:entityType/:entityId')
  @UseGuards(JwtAuthGuard, TrialGuard)
  async findByEntity(
    @Req() req: Request,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    const userIdFromJwt =
      (req.user as any)?.sub ||
      (req.user as any)?.id ||
      (req.user as any)?.userId;

    if (!userIdFromJwt) {
      throw new HttpException(
        'User authentication failed - no user ID found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = await this.userService.findOneWithSubscription(userIdFromJwt);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const planId = user?.subscription?.planId || 'starter';
    const plan =
      (await this.userService.getPlanById(planId)) ||
      (await this.userService.getPlanById('starter'));
    if (!plan?.features?.includes('audit_logs')) {
      throw new HttpException(
        'Audit log access is not available on your plan.',
        HttpStatus.FORBIDDEN,
      );
    }
    return await this.auditLogService.findByEntity(entityType, entityId);
  }

  @Get('my/logs')
  @UseGuards(JwtAuthGuard, TrialGuard)
  async getMyAuditLogs(@Req() req: any) {
    let userId = req.user?.sub || req.user?.id || req.user?.userId;
    if (!userId) {
      userId = req.headers['x-user-id'];
    }

    if (!userId) {
      throw new HttpException('User ID not found', HttpStatus.UNAUTHORIZED);
    }

    try {
      const auditLogs = await this.auditLogService.findByUser(userId);
      return auditLogs;
    } catch (error) {
      throw new HttpException(
        `Failed to get audit logs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const auditLog = await this.auditLogService.remove(id);
      if (!auditLog) {
        throw new HttpException('Audit log not found', HttpStatus.NOT_FOUND);
      }
      return { message: 'Audit log deleted successfully' };
    } catch (error) {
      throw new HttpException(
        'Failed to delete audit log',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('export')
  @UseGuards(JwtAuthGuard, TrialGuard)
  async exportAuditLogs(
    @Req() req: Request,
    @Body()
    filters: {
      dateRange?: string;
      user?: string;
      action?: string;
    },
  ) {
    const userIdFromJwt =
      (req.user as any)?.sub ||
      (req.user as any)?.id ||
      (req.user as any)?.userId;

    if (!userIdFromJwt) {
      throw new HttpException(
        'User authentication failed - no user ID found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = await this.userService.findOneWithSubscription(userIdFromJwt);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const planId = user?.subscription?.planId || 'starter';
    const plan =
      (await this.userService.getPlanById(planId)) ||
      (await this.userService.getPlanById('starter'));
    if (!plan?.features?.includes('audit_logs')) {
      throw new HttpException(
        'Audit log access is not available on your plan.',
        HttpStatus.FORBIDDEN,
      );
    }

    try {
      const auditLogs = await this.auditLogService.findAll();
      return {
        data: auditLogs,
        exportDate: new Date().toISOString(),
        filters: filters,
        totalRecords: auditLogs.length,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to export audit logs',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
