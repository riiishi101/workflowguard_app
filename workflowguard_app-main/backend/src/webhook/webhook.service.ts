import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class WebhookService {
  constructor(private prisma: PrismaService, private auditLogService: AuditLogService) {}

  async create(data: { userId: string; name?: string; endpointUrl: string; secret?: string; events: string[] }) {
    const webhook = await this.prisma.webhook.create({ data });
    await this.auditLogService.create({
      userId: data.userId,
      action: 'create',
      entityType: 'webhook',
      entityId: webhook.id,
      newValue: webhook,
    });
    return webhook;
  }

  async findAllByUser(userId: string) {
    return this.prisma.webhook.findMany({ where: { userId } });
  }

  async remove(id: string, userId: string) {
    const oldWebhook = await this.prisma.webhook.findUnique({ where: { id } });
    const deleted = await this.prisma.webhook.delete({ where: { id, userId } });
    await this.auditLogService.create({
      userId,
      action: 'delete',
      entityType: 'webhook',
      entityId: id,
      oldValue: oldWebhook,
    });
    return deleted;
  }
}
