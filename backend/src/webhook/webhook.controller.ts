import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
  Logger,
  Headers,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlanFeature, PlanFeatureGuard } from '../auth/roles.guard';
import { Request } from 'express';
import { UserService } from '../user/user.service';
import { Public } from '../auth/public.decorator';
import * as crypto from 'crypto';
import { CreateWebhookDto } from './dto/create-webhook.dto';

@Controller('webhooks')
@UseGuards(JwtAuthGuard, PlanFeatureGuard)
@PlanFeature('custom_notifications')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);
  constructor(
    private readonly webhookService: WebhookService,
    private readonly userService: UserService,
  ) {}

  @Post()
  async create(
    @Req() req: Request,
    @Body() createWebhookDto: CreateWebhookDto,
  ) {
    const userId = (req as any).user?.sub;
    if (!userId)
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.webhookService.create({ userId, ...createWebhookDto });
  }

  @Get()
  async findAll(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    if (!userId)
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.webhookService.findAllByUser(userId);
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user?.sub;
    if (!userId)
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.webhookService.remove(id, userId);
  }

  // HubSpot Uninstall Webhook
  @Public()
  @Post('hubspot/uninstall')
  async handleHubSpotUninstall(
    @Body('portalId') portalId: string,
    @Headers('x-hubspot-signature') signature: string,
    @Req() req: Request,
  ) {
    // Validate signature if secret is set
    const secret = process.env.HUBSPOT_WEBHOOK_SECRET;
    if (secret) {
      const payload = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      if (signature !== expectedSignature) {
        this.logger.warn(
          `Invalid HubSpot webhook signature for portalId ${portalId}`,
        );
        throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED);
      }
    }
    this.logger.log(
      `Received HubSpot uninstall webhook for portalId ${portalId}`,
    );
    if (!portalId) {
      this.logger.warn('Missing portalId in uninstall webhook');
      throw new HttpException('Missing portalId', HttpStatus.BAD_REQUEST);
    }
    // Find user by hubspotPortalId using a public service method
    const user = await this.userService.findByHubspotPortalId(portalId);
    if (!user) {
      this.logger.warn(`User not found for portalId ${portalId}`);
      throw new HttpException(
        'User not found for portalId',
        HttpStatus.NOT_FOUND,
      );
    }
    try {
      await this.userService.remove(user.id, undefined);
      this.logger.log(`User and data deleted for portalId ${portalId}`);
      return { message: 'User and data deleted for portalId ' + portalId };
    } catch (err) {
      this.logger.error(
        `Failed to delete user for portalId ${portalId}: ${err.message}`,
      );
      throw new HttpException(
        'Failed to delete user: ' + err.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
