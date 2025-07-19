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
import { Roles } from '../auth/roles.decorator';
import { UserService } from '../user/user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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
      console.error('Failed to create audit log:', error);
      throw new HttpException(
        'Failed to create audit log',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Req() req: Request,
    @Query('userId') userId?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const userIdFromJwt = (req.user as any)?.sub;
    const user = await this.userService.findOneWithSubscription(userIdFromJwt);
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
    // Advanced filtering
    const where: any = {};
    if (userId) where.userId = userId;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;
    if (startDate && endDate) {
      where.timestamp = {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59.999Z'),
      };
    }
    if (Object.keys(where).length > 0) {
      return await this.auditLogService.findAdvanced(where);
    }
    return await this.auditLogService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const userIdFromJwt = (req.user as any)?.sub;
    const user = await this.userService.findOneWithSubscription(userIdFromJwt);
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
  @UseGuards(JwtAuthGuard)
  async findByUser(@Req() req: Request, @Param('userId') userId: string) {
    const userIdFromJwt = (req.user as any)?.sub;
    const user = await this.userService.findOneWithSubscription(userIdFromJwt);
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
    return await this.auditLogService.findByUser(userId);
  }

  @Get('entity/:entityType/:entityId')
  @UseGuards(JwtAuthGuard)
  async findByEntity(
    @Req() req: Request,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    const userIdFromJwt = (req.user as any)?.sub;
    const user = await this.userService.findOneWithSubscription(userIdFromJwt);
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

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id') id: string) {
    try {
      const auditLog = await this.auditLogService.remove(id);
      if (!auditLog) {
        throw new HttpException('Audit log not found', HttpStatus.NOT_FOUND);
      }
      return { message: 'Audit log deleted successfully' };
    } catch (error) {
      console.error('Failed to delete audit log:', error);
      throw new HttpException(
        'Failed to delete audit log',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
