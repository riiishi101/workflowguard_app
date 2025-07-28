import {
  Controller,
  Get,
  Put,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('sso-config')
export class SsoConfigController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get()
  async getConfig() {
    const config = await this.prisma.ssoConfig.findFirst();
    if (!config)
      throw new HttpException('SSO config not found', HttpStatus.NOT_FOUND);
    return config;
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  async updateConfig(
    @Req() req: Request,
    @Body() dto: { provider: string; metadata: string; enabled: boolean },
  ) {
    const userId = (req.user as any)?.sub;
    let config = await this.prisma.ssoConfig.findFirst();
    const oldConfig = config ? { ...config } : null;
    if (!config) {
      config = await this.prisma.ssoConfig.create({ data: dto });
    } else {
      config = await this.prisma.ssoConfig.update({
        where: { id: config.id },
        data: dto,
      });
    }
    await this.auditLogService.create({
      userId,
      action: 'update',
      entityType: 'sso_config',
      entityId: config.id,
      oldValue: oldConfig,
      newValue: config,
    });
    return config;
  }
}
