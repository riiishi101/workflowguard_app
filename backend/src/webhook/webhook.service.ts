import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Webhook as PrismaWebhook } from '@prisma/client';
import axios from 'axios';
import * as crypto from 'crypto';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { Webhook } from './types/webhook.types';

@Injectable()
export class WebhookService {
  constructor(private prisma: PrismaService) {}

  private toWebhook(dbWebhook: PrismaWebhook): Webhook {
    return {
      ...dbWebhook,
      name: dbWebhook.name || '',
      events: dbWebhook.events ? dbWebhook.events.split(',') : [],
    };
  }

  async createWebhook(userId: string, webhookData: CreateWebhookDto): Promise<Webhook> {
    try {
      const newWebhook = await this.prisma.webhook.create({
        data: {
          userId: userId,
          name: webhookData.name,
          endpointUrl: webhookData.endpointUrl,
          secret: this.generateWebhookSecret(),
          events: (webhookData.events || ['workflow.changed', 'workflow.rolled_back']).join(','),
        },
      });
      return this.toWebhook(newWebhook);
    } catch (error) {
      throw new HttpException(
        `Failed to create webhook: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUserWebhooks(userId: string): Promise<Webhook[]> {
    try {
      const webhooks = await this.prisma.webhook.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
      });

      return webhooks.map(dbWebhook => ({
        ...this.toWebhook(dbWebhook),
        secret: dbWebhook.secret ? `${dbWebhook.secret.substring(0, 8)}...` : null,
      }));
    } catch (error) {
      throw new HttpException(
        `Failed to get webhooks: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateWebhook(
    webhookId: string,
    userId: string,
    webhookData: UpdateWebhookDto,
  ): Promise<Webhook> {
    try {
      const { events, ...rest } = webhookData;
      const dataToUpdate: {
        name?: string;
        endpointUrl?: string;
        events?: string;
      } = { ...rest };

      if (events) {
        dataToUpdate.events = events.join(',');
      }

      const updatedWebhook = await this.prisma.webhook.update({
        where: {
          id: webhookId,
          userId: userId,
        },
        data: dataToUpdate,
      });
      return this.toWebhook(updatedWebhook);
    } catch (error) {
      throw new HttpException(
        `Failed to update webhook: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteWebhook(webhookId: string, userId: string): Promise<{ success: boolean }> {
    try {
      await this.prisma.webhook.delete({
        where: {
          id: webhookId,
          userId: userId,
        },
      });

      return { success: true };
    } catch (error) {
      throw new HttpException(
        `Failed to delete webhook: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendWebhookNotification(
    event: string,
    data: any,
    userId: string,
  ): Promise<void> {
    try {
      const webhooks = await this.prisma.webhook.findMany({
        where: {
          userId: userId,
        },
      });

      const filteredWebhooks = webhooks.filter((webhook) =>
        webhook.events ? webhook.events.split(',').includes(event) : false,
      );

      const webhookPromises = filteredWebhooks.map((webhook) =>
        this.sendWebhookToEndpoint(this.toWebhook(webhook), event, data),
      );

      await Promise.allSettled(webhookPromises);
    } catch (error) {
      console.error('Failed to send webhook notifications:', error);
    }
  }

  private async sendWebhookToEndpoint(
    webhook: Webhook,
    event: string,
    data: any,
  ): Promise<void> {
    try {
      const payload = {
        event: event,
        timestamp: new Date().toISOString(),
        data: data,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'WorkflowGuard-Webhook/1.0',
      };

      // Add signature if secret is configured
      if (webhook.secret) {
        const signature = this.generateSignature(payload, webhook.secret);
        headers['X-WorkflowGuard-Signature'] = signature;
      }

      await axios.post(webhook.endpointUrl, payload, {
        headers: headers,
        timeout: 10000, // 10 second timeout
      });

      // Note: lastUsed field doesn't exist in the schema, so we skip updating it
    } catch (error) {
      console.error(
        `Failed to send webhook to ${webhook.endpointUrl}:`,
        error.message,
      );

      // Log webhook failure
      await this.prisma.auditLog.create({
        data: {
          userId: webhook.userId,
          action: 'webhook_delivery_failed',
          entityType: 'webhook',
          entityId: webhook.id,
          oldValue: undefined,
          newValue: {
            endpointUrl: webhook.endpointUrl,
            error: error.message,
          },
        },
      });
    }
  }

  private generateWebhookSecret(): string {
    return `whsec_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateSignature(payload: any, secret: string): string {
    const payloadString = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');
  }

  // Enterprise features
  async sendWorkflowChangeNotification(
    workflowId: string,
    userId: string,
    changes: any,
  ): Promise<void> {
    await this.sendWebhookNotification(
      'workflow.changed',
      {
        workflowId: workflowId,
        changes: changes,
        timestamp: new Date().toISOString(),
      },
      userId,
    );
  }

  async sendWorkflowRollbackNotification(
    workflowId: string,
    userId: string,
    versionId: string,
  ): Promise<void> {
    await this.sendWebhookNotification(
      'workflow.rolled_back',
      {
        workflowId: workflowId,
        versionId: versionId,
        timestamp: new Date().toISOString(),
      },
      userId,
    );
  }

  async sendApprovalRequestNotification(
    approvalRequestId: string,
    userId: string,
    workflowId: string,
  ): Promise<void> {
    await this.sendWebhookNotification(
      'approval.requested',
      {
        approvalRequestId: approvalRequestId,
        workflowId: workflowId,
        timestamp: new Date().toISOString(),
      },
      userId,
    );
  }

  async sendComplianceReportNotification(
    workflowId: string,
    userId: string,
    reportData: any,
  ): Promise<void> {
    await this.sendWebhookNotification(
      'compliance.report_generated',
      {
        workflowId: workflowId,
        reportData: reportData,
        timestamp: new Date().toISOString(),
      },
      userId,
    );
  }
}
