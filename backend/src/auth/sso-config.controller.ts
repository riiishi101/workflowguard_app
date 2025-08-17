import {
  Controller,
  Get,
  Put,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('sso-config')
export class SsoConfigController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getConfig() {
    const config = await this.prisma.ssoConfig.findFirst();
    if (!config)
      throw new HttpException('SSO config not found', HttpStatus.NOT_FOUND);
    return config;
  }

  @Put()
  async updateConfig(
    @Body()
    dto: {
      provider: string;
      clientId: string;
      clientSecret: string;
      redirectUri: string;
      metadata?: string;
      enabled: boolean;
    },
  ) {
    let config = await this.prisma.ssoConfig.findFirst();
    if (!config) {
      config = await this.prisma.ssoConfig.create({ data: dto });
    } else {
      config = await this.prisma.ssoConfig.update({
        where: { id: config.id },
        data: dto,
      });
    }
    return config;
  }
}
