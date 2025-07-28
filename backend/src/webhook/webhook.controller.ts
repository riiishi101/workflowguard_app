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
import { ApiParam } from '@nestjs/swagger';

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
  @ApiParam({ name: 'id', type: String, description: 'Webhook ID' })
  async remove(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user?.sub;
    if (!userId)
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.webhookService.remove(id, userId);
  }

  // HubSpot Install Webhook
  @Public()
  @Post('hubspot/install')
  async handleHubSpotInstall(
    @Body() body: { 
      portalId: string; 
      userId?: string; 
      planId?: string;
      installType?: string;
    },
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
          `Invalid HubSpot webhook signature for install portalId ${body.portalId}`,
        );
        throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED);
      }
    }

    this.logger.log(
      `Received HubSpot install webhook for portalId ${body.portalId}`,
    );

    if (!body.portalId) {
      this.logger.warn('Missing portalId in install webhook');
      throw new HttpException('Missing portalId', HttpStatus.BAD_REQUEST);
    }

    try {
      // Find existing user for this portal
      let user = await this.userService.findByHubspotPortalId(body.portalId);
      
      if (!user) {
        // Create new user for this portal
        user = await this.userService.create({
          email: `portal-${body.portalId}@workflowguard.pro`,
          role: 'user',
        });
      }
      
      // Set up trial period if needed
      if (user && (!user.planId || !user.isTrialActive)) {
        await this.userService.update(user.id, {
          planId: body.planId || 'professional',
          isTrialActive: true,
          trialStartDate: new Date(),
          trialEndDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days
          trialPlanId: 'professional',
          hubspotPortalId: body.portalId,
        });
      }

      this.logger.log(`User setup completed for portalId ${body.portalId}`);
      return { 
        message: 'Installation successful', 
        portalId: body.portalId,
        userId: user?.id 
      };
    } catch (err) {
      this.logger.error(
        `Failed to setup user for portalId ${body.portalId}: ${err.message}`,
      );
      throw new HttpException(
        'Failed to setup user: ' + err.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
