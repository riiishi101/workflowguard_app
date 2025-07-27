import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpException,
  HttpStatus,
  UseGuards,
  Req,
  Query,
  Put,
  Res,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateNotificationSettingsDto,
} from './dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { Roles } from '../auth/roles.decorator';
import { PlanFeature, PlanFeatureGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request, Response } from 'express';
import { RolesGuard } from '../auth/roles.guard';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles('admin')
  @PlanFeature('user_permissions')
  @UseGuards(PlanFeatureGuard)
  async create(@Req() req: Request, @Body() createUserDto: CreateUserDto) {
    try {
      const actorUserId = (req as any).user?.sub;
      return await this.userService.create(createUserDto, actorUserId);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new HttpException(
          'User with this email already exists',
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException(
        'Failed to create user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async findAll() {
    return await this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User found.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findOne(id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Get a user by email' })
  @ApiParam({ name: 'email', type: String, description: 'User email' })
  @ApiResponse({ status: 200, description: 'User found.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
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
  @ApiOperation({ summary: 'Update a user by ID' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User updated.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    try {
      const actorUserId = (req as any).user?.sub;
      const user = await this.userService.update(id, {
        ...updateUserDto,
        updatedBy: actorUserId,
      });
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      return user;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new HttpException(
          'User with this email already exists',
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException(
        'Failed to update user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @Roles('admin')
  @PlanFeature('user_permissions')
  @UseGuards(PlanFeatureGuard)
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async remove(@Req() req: Request, @Param('id') id: string) {
    try {
      const actorUserId = (req as any).user?.sub;
      const user = await this.userService.remove(id, actorUserId);
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      return { message: 'User deleted successfully' };
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw new HttpException(
        'Failed to delete user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('me/plan')
  @UseGuards(JwtAuthGuard)
  async getMyPlan(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    if (!userId)
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    const user = await this.userService.findOneWithSubscription(userId);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    // Default to starter plan if no subscription exists
    const planId = user.subscription?.planId || 'starter';
    const plan = await this.userService.getPlanById(planId);
    const workflowsMonitoredCount =
      await this.userService.getWorkflowCountByOwner(userId);

    return {
      planId,
      status: user.subscription?.status || 'active',
      trialEndDate: user.subscription?.trialEndDate,
      nextBillingDate: user.subscription?.nextBillingDate,
      features: plan?.features || [],
      maxWorkflows: plan?.maxWorkflows || 50,
      historyDays: plan?.historyDays || 30,
      workflowsMonitoredCount,
      hubspotPortalId: user?.hubspotPortalId || null,
    };
  }

  @Get(':id/plan')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get a user plan by user ID' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User plan found.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getUserPlan(@Param('id') id: string) {
    return this.userService.getUserPlan(id);
  }

  @Get(':id/overages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get user overages by user ID' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User overages found.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
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
  @ApiOperation({ summary: 'Get user overages stats by user ID' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User overages stats found.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getOverageStats(@Param('id') id: string) {
    return this.userService.getOverageStats(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/notification-settings')
  async getMyNotificationSettings(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    if (!userId)
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.userService.getNotificationSettings(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me/notification-settings')
  async updateMyNotificationSettings(
    @Req() req: Request,
    @Body() dto: UpdateNotificationSettingsDto,
  ) {
    const userId = (req as any).user?.sub;
    if (!userId)
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.userService.updateNotificationSettings(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/api-keys')
  async getMyApiKeys(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    if (!userId)
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.userService.getApiKeys(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/api-keys')
  async createMyApiKey(@Req() req: Request, @Body() dto: CreateApiKeyDto) {
    const userId = (req as any).user?.sub;
    if (!userId)
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.userService.createApiKey(userId, dto.description);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/api-keys/:id')
  @ApiOperation({ summary: 'Delete an API key by ID' })
  @ApiParam({ name: 'id', type: String, description: 'API Key ID' })
  @ApiResponse({ status: 200, description: 'API key deleted.' })
  @ApiResponse({ status: 404, description: 'API key not found.' })
  async deleteMyApiKey(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user?.sub;
    if (!userId)
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.userService.deleteApiKey(userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    if (!userId)
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    const start = Date.now();
    const result = await this.userService.getMe(userId);
    const duration = Date.now() - start;
    console.log(`[PERF] /me for user ${userId} took ${duration}ms`);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Put('me')
  async updateMe(@Req() req: Request, @Body() dto: UpdateUserDto) {
    const userId = (req as any).user?.sub;
    if (!userId)
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.userService.updateMe(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async deleteMe(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    if (!userId)
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.userService.deleteMe(userId);
  }

  @Post(':id/reset-password')
  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reset user password by user ID' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Password reset.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async resetPassword(@Param('id') id: string) {
    await this.userService.resetPassword(id);
    return { message: 'Password reset initiated.' };
  }

  @Post('reset-password')
  async resetPasswordWithToken(
    @Body() body: { token: string; newPassword: string },
  ) {
    const { token, newPassword } = body;
    const result = await this.userService.resetPasswordWithToken(
      token,
      newPassword,
    );
    if (result.success) {
      return { message: 'Password has been reset successfully.' };
    } else {
      throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('active-installs')
  async getActiveInstalls(@Res() res: Response) {
    const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const count = await this.userService.countActiveInstalls(THIRTY_DAYS_AGO);
    return res.status(200).json({ activeInstalls: count });
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/plan-status')
  async getMyPlanStatus(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    console.log('Plan-status - JWT payload:', (req as any).user);
    if (!userId) {
      console.warn(
        'Plan-status - No userId in JWT payload, returning default plan status',
      );
      return {
        planId: 'trial',
        isTrialActive: false,
        trialEndDate: null,
        trialPlanId: null,
        remainingTrialDays: null,
      };
    }
    console.log('Plan-status - User ID from JWT:', userId);
    const user = await this.userService.findOne(userId);
    console.log(
      'Plan-status - User found:',
      user ? 'Yes' : 'No',
      user ? `ID: ${user.id}` : '',
    );
    if (!user) {
      console.log(
        'Plan-status - User not found in database, creating default plan status',
      );
      return {
        planId: 'trial',
        isTrialActive: false,
        trialEndDate: null,
        trialPlanId: null,
        remainingTrialDays: null,
      };
    }
    const now = new Date();
    let remainingTrialDays = null;
    if (user.trialEndDate && user.isTrialActive) {
      remainingTrialDays = Math.max(
        0,
        Math.ceil(
          (user.trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        ),
      );
    }
    console.log('Plan-status - Returning plan status:', {
      planId: user.planId,
      isTrialActive: user.isTrialActive,
      remainingTrialDays,
    });
    return {
      planId: user.planId || 'trial',
      isTrialActive: user.isTrialActive || false,
      trialEndDate: user.trialEndDate,
      trialPlanId: user.trialPlanId,
      remainingTrialDays,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/export')
  async exportMyData(@Req() req: Request, @Res() res: Response) {
    const userId = (req as any).user?.sub;
    if (!userId)
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    const data = await this.userService.exportUserData(userId);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="user-data-${userId}.json"`,
    );
    res.send(JSON.stringify(data, null, 2));
  }

  @Get(':id/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Export user data by user ID' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User data exported.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async exportUserData(@Param('id') id: string, @Res() res: Response) {
    const data = await this.userService.exportUserData(id);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="user-data-${id}.json"`,
    );
    res.send(JSON.stringify(data, null, 2));
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/disconnect-hubspot')
  async disconnectHubspot(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    if (!userId)
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    await this.userService.disconnectHubspot(userId);
    return { message: 'HubSpot disconnected' };
  }

  @UseGuards(JwtAuthGuard)
  @Put('me/plan')
  async updateMyPlan(@Req() req: Request, @Body() body: { planId: string }) {
    const userId = (req as any).user?.sub;
    if (!userId)
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    if (!body.planId)
      throw new HttpException('planId is required', HttpStatus.BAD_REQUEST);
    return this.userService.updateUserPlan(userId, body.planId);
  }
}
