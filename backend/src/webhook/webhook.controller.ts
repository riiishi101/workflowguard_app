import { Controller, Post, Get, Delete, Body, Req, Param, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlanFeature, PlanFeatureGuard } from '../auth/roles.guard';
import { Request } from 'express';
import { UserService } from '../user/user.service';
import { Public } from '../auth/public.decorator';

@Controller('webhooks')
@UseGuards(JwtAuthGuard, PlanFeatureGuard)
@PlanFeature('custom_notifications')
export class WebhookController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly userService: UserService,
  ) {}

  @Post()
  async create(@Req() req: Request, @Body() body: { name?: string; endpointUrl: string; secret?: string; events: string[] }) {
    const userId = ((req as any).user)?.sub;
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.webhookService.create({ userId, ...body });
  }

  @Get()
  async findAll(@Req() req: Request) {
    const userId = ((req as any).user)?.sub;
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.webhookService.findAllByUser(userId);
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const userId = ((req as any).user)?.sub;
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.webhookService.remove(id, userId);
  }

  // HubSpot Uninstall Webhook
  @Public()
  @Post('hubspot/uninstall')
  async handleHubSpotUninstall(@Body('portalId') portalId: string) {
    if (!portalId) {
      throw new HttpException('Missing portalId', HttpStatus.BAD_REQUEST);
    }
    // Find user by hubspotPortalId using a public service method
    const user = await this.userService.findByHubspotPortalId(portalId);
    if (!user) {
      throw new HttpException('User not found for portalId', HttpStatus.NOT_FOUND);
    }
    try {
      await this.userService.remove(user.id, undefined);
      return { message: 'User and data deleted for portalId ' + portalId };
    } catch (err) {
      throw new HttpException('Failed to delete user: ' + err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
