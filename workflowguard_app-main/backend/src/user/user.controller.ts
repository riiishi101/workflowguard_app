import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, UseGuards, Req, Query, Put } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, UpdateNotificationSettingsDto } from './dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { Roles } from '../auth/roles.decorator';
import { PlanFeature, PlanFeatureGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PLAN_CONFIG } from '../plan-config';
import { Request } from 'express';
import { RolesGuard } from '../auth/roles.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles('admin')
  @PlanFeature('user_permissions')
  @UseGuards(PlanFeatureGuard)
  async create(@Req() req: Request, @Body() createUserDto: CreateUserDto) {
    try {
      const actorUserId = (req.user as any)?.sub;
      return await this.userService.create(createUserDto, actorUserId);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new HttpException('User with this email already exists', HttpStatus.CONFLICT);
      }
      throw new HttpException('Failed to create user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  async findAll() {
    return await this.userService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findOne(id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  @Get('email/:email')
  async findByEmail(@Param('email') email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  @Patch(':id')
  @PlanFeature('user_permissions')
  @UseGuards(PlanFeatureGuard)
  async update(@Req() req: Request, @Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    try {
      const actorUserId = (req.user as any)?.sub;
      const user = await this.userService.update(id, { ...updateUserDto, updatedBy: actorUserId });
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      return user;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new HttpException('User with this email already exists', HttpStatus.CONFLICT);
      }
      throw new HttpException('Failed to update user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  @Roles('admin')
  @PlanFeature('user_permissions')
  @UseGuards(PlanFeatureGuard)
  async remove(@Req() req: Request, @Param('id') id: string) {
    try {
      const actorUserId = (req.user as any)?.sub;
      const user = await this.userService.remove(id, actorUserId);
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      return { message: 'User deleted successfully' };
    } catch (error) {
      throw new HttpException('Failed to delete user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('me/plan')
  @UseGuards(JwtAuthGuard)
  async getMyPlan(@Req() req: Request) {
    const userId = (req.user as any)?.sub;
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    const user = await this.userService.findOneWithSubscription(userId);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    const planId = user.subscription?.planId || 'starter';
    const plan = await this.userService.getPlanById(planId) || await this.userService.getPlanById('starter');
    const workflowsMonitoredCount = await this.userService.getWorkflowCountByOwner(userId);
    return {
      planId,
      status: user.subscription?.status || 'active',
      trialEndDate: user.subscription?.trialEndDate,
      nextBillingDate: user.subscription?.nextBillingDate,
      features: plan?.features,
      maxWorkflows: plan?.maxWorkflows,
      historyDays: plan?.historyDays,
      workflowsMonitoredCount,
      hubspotPortalId: user?.hubspotPortalId || null,
    };
  }

  @Get(':id/plan')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getUserPlan(@Param('id') id: string) {
    return this.userService.getUserPlan(id);
  }

  @Get(':id/overages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getUserOverages(
    @Param('id') id: string,
    @Query('periodStart') periodStart?: string,
    @Query('periodEnd') periodEnd?: string,
  ) {
    const startDate = periodStart ? new Date(periodStart) : undefined;
    const endDate = periodEnd ? new Date(periodEnd) : undefined;
    return this.userService.getUserOverages(id, startDate, endDate);
  }

  @Get(':id/overages/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getOverageStats(@Param('id') id: string) {
    return this.userService.getOverageStats(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/notification-settings')
  async getMyNotificationSettings(@Req() req: Request) {
    const userId = (req.user as any)?.sub;
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.userService.getNotificationSettings(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me/notification-settings')
  async updateMyNotificationSettings(@Req() req: Request, @Body() dto: UpdateNotificationSettingsDto) {
    const userId = (req.user as any)?.sub;
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.userService.updateNotificationSettings(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/api-keys')
  async getMyApiKeys(@Req() req: Request) {
    const userId = (req.user as any)?.sub;
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.userService.getApiKeys(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/api-keys')
  async createMyApiKey(@Req() req: Request, @Body() dto: CreateApiKeyDto) {
    const userId = (req.user as any)?.sub;
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.userService.createApiKey(userId, dto.description);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/api-keys/:id')
  async deleteMyApiKey(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any)?.sub;
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.userService.deleteApiKey(userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: Request) {
    const userId = (req.user as any)?.sub;
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.userService.getMe(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me')
  async updateMe(@Req() req: Request, @Body() dto: UpdateUserDto) {
    const userId = (req.user as any)?.sub;
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.userService.updateMe(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async deleteMe(@Req() req: Request) {
    const userId = (req.user as any)?.sub;
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.userService.deleteMe(userId);
  }

  @Post(':id/reset-password')
  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  async resetPassword(@Param('id') id: string) {
    await this.userService.resetPassword(id);
    return { message: 'Password reset initiated.' };
  }

  @Post('reset-password')
  async resetPasswordWithToken(@Body() body: { token: string; newPassword: string }) {
    const { token, newPassword } = body;
    const result = await this.userService.resetPasswordWithToken(token, newPassword);
    if (result.success) {
      return { message: 'Password has been reset successfully.' };
    } else {
      throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
    }
  }
}
