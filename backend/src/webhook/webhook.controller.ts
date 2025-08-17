import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestWithUser } from '../types/request.types';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';

@Controller('webhooks')
@UseGuards(JwtAuthGuard)
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  private getUserId(req: RequestWithUser): string {
    const userId = req.user?.sub || req.user?.id || req.user?.userId;
    if (!userId) {
      throw new HttpException('User ID not found in token', HttpStatus.UNAUTHORIZED);
    }
    return userId;
  }

  @Get()
  async getUserWebhooks(@Req() req: RequestWithUser) {
    const userId = this.getUserId(req);
    try {
      const webhooks = await this.webhookService.getUserWebhooks(userId);
      return {
        success: true,
        data: webhooks,
        message: 'Webhooks retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get webhooks',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async createWebhook(
    @Body() webhookData: CreateWebhookDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = this.getUserId(req);
    try {
      const webhook = await this.webhookService.createWebhook(userId, webhookData);
      return {
        success: true,
        data: webhook,
        message: 'Webhook created successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create webhook',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  async updateWebhook(
    @Param('id') webhookId: string,
    @Body() webhookData: UpdateWebhookDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = this.getUserId(req);
    try {
      const webhook = await this.webhookService.updateWebhook(
        webhookId,
        userId,
        webhookData,
      );
      return {
        success: true,
        data: webhook,
        message: 'Webhook updated successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update webhook',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async deleteWebhook(@Param('id') webhookId: string, @Req() req: RequestWithUser) {
    const userId = this.getUserId(req);
    try {
      await this.webhookService.deleteWebhook(webhookId, userId);
      return {
        success: true,
        message: 'Webhook deleted successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete webhook',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
