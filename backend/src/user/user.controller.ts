import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
  Put,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestWithUser } from '../types/request.types';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  private getUserId(req: RequestWithUser): string {
    const userId = req.user?.sub || req.user?.id || req.user?.userId;
    if (!userId) {
      throw new HttpException('User ID not found in token', HttpStatus.UNAUTHORIZED);
    }
    return userId;
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: RequestWithUser) {
    const userId = this.getUserId(req);
    const user = await this.userService.findOneWithSubscription(userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription: user.subscription,
      },
    };
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  @Get('permissions')
  @UseGuards(JwtAuthGuard)
  async getUserPermissions(@Req() req: RequestWithUser) {
    try {
      const userId = this.getUserId(req);
      const user = await this.userService.findOneWithSubscription(userId);
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const planId = user?.subscription?.planId || 'starter';
      const plan = await this.userService.getPlanById(planId);

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
          permissions: ['read_workflows', 'write_workflows', 'view_dashboard'],
          plan: plan?.name || 'Starter',
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      throw new HttpException(
        `Failed to get user permissions: ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('notification-settings')
  @UseGuards(JwtAuthGuard)
  async getNotificationSettings(@Req() req: RequestWithUser) {
    try {
      const userId = this.getUserId(req);
      const settings = await this.userService.getNotificationSettings(userId);
      return {
        success: true,
        data: settings,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      throw new HttpException(
        `Failed to get notification settings: ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('notification-settings')
  @UseGuards(JwtAuthGuard)
  async updateNotificationSettings(
    @Req() req: RequestWithUser,
    @Body() settingsDto: UpdateNotificationSettingsDto,
  ) {
    try {
      const userId = this.getUserId(req);
      const updatedSettings = await this.userService.updateNotificationSettings(
        userId,
        settingsDto,
      );
      return {
        success: true,
        data: updatedSettings,
        message: 'Notification settings updated successfully',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      throw new HttpException(
        `Failed to update notification settings: ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('api-keys')
  @UseGuards(JwtAuthGuard)
  async getApiKeys(@Req() req: RequestWithUser) {
    try {
      const userId = this.getUserId(req);
      const user = await this.userService.findOneWithSubscription(userId);
      const planId = user?.subscription?.planId || 'starter';
      const plan = await this.userService.getPlanById(planId);

      if (!plan?.features?.includes('api_access')) {
        throw new HttpException(
          'API access is not available on your plan.',
          HttpStatus.FORBIDDEN,
        );
      }

      const apiKeys = await this.userService.getApiKeys(userId);
      return {
        success: true,
        data: apiKeys,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      throw new HttpException(
        `Failed to get API keys: ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('api-keys')
  @UseGuards(JwtAuthGuard)
  async createApiKey(
    @Req() req: RequestWithUser,
    @Body() apiKeyData: CreateApiKeyDto,
  ) {
    try {
      const userId = this.getUserId(req);
      const user = await this.userService.findOneWithSubscription(userId);
      const planId = user?.subscription?.planId || 'starter';
      const plan = await this.userService.getPlanById(planId);

      if (!plan?.features?.includes('api_access')) {
        throw new HttpException(
          'API access is not available on your plan.',
          HttpStatus.FORBIDDEN,
        );
      }

      const apiKey = await this.userService.createApiKey(userId, apiKeyData);
      return {
        success: true,
        data: apiKey,
        message: 'API key created successfully',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      throw new HttpException(
        `Failed to create API key: ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('api-keys/:keyId')
  @UseGuards(JwtAuthGuard)
  async deleteApiKey(@Req() req: RequestWithUser, @Param('keyId') keyId: string) {
    try {
      const userId = this.getUserId(req);
      const user = await this.userService.findOneWithSubscription(userId);
      const planId = user?.subscription?.planId || 'starter';
      const plan = await this.userService.getPlanById(planId);

      if (!plan?.features?.includes('api_access')) {
        throw new HttpException(
          'API access is not available on your plan.',
          HttpStatus.FORBIDDEN,
        );
      }

      await this.userService.deleteApiKey(userId, keyId);
      return {
        success: true,
        message: 'API key deleted successfully',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      throw new HttpException(
        `Failed to delete API key: ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('disconnect-hubspot')
  @UseGuards(JwtAuthGuard)
  async disconnectHubSpot(@Req() req: RequestWithUser) {
    try {
      const userId = this.getUserId(req);
      await this.userService.disconnectHubSpot(userId);
      return {
        success: true,
        message: 'HubSpot connection has been successfully disconnected.',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      throw new HttpException(
        `Failed to disconnect HubSpot: ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
