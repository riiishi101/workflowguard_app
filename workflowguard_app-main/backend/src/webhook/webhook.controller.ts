import { Controller, Post, Get, Delete, Body, Req, Param, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlanFeature, PlanFeatureGuard } from '../auth/roles.guard';
import { Request } from 'express';

@Controller('webhooks')
@UseGuards(JwtAuthGuard, PlanFeatureGuard)
@PlanFeature('custom_notifications')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  async create(@Req() req: Request, @Body() body: { name?: string; endpointUrl: string; secret?: string; events: string[] }) {
    const userId = (req.user as any)?.sub;
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.webhookService.create({ userId, ...body });
  }

  @Get()
  async findAll(@Req() req: Request) {
    const userId = (req.user as any)?.sub;
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.webhookService.findAllByUser(userId);
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any)?.sub;
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.webhookService.remove(id, userId);
  }
}
