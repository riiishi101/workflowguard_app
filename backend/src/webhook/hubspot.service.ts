import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateAuditLogDto } from '../audit-log/dto/create-audit-log.dto';
import { HubspotEventDto } from './dto/hubspot-event.dto';

@Injectable()
export class HubspotService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  async processWebhookEvent(event: HubspotEventDto) {
    console.log(`Processing event: ${event.subscriptionType}`);

    const auditLog: Partial<CreateAuditLogDto> = {
      entityType: 'workflow',
      entityId: event.objectId?.toString(),
      newValue: event,
    };

    switch (event.subscriptionType) {
      case 'workflow.creation':
        auditLog.action = 'create';
        break;
      case 'workflow.deletion':
        auditLog.action = 'delete';
        break;
      case 'workflow.propertyChange':
        auditLog.action = 'update';
        auditLog.entityId = event.objectId?.toString();
        break;
      default:
        console.log(`Unhandled event type: ${event.subscriptionType}`);
        return;
    }

    await this.auditLogService.create(auditLog as CreateAuditLogDto);
  }

  isSignatureValid(req: any): boolean {
    const signature = req.headers['x-hubspot-signature-v3'] as string;
    const timestamp = req.headers['x-hubspot-request-timestamp'] as string;
    const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;

    if (!signature || !timestamp || !clientSecret) {
      return false;
    }

    // 1. Check if the timestamp is within 5 minutes of the current time
    const fiveMinutesInMillis = 5 * 60 * 1000;
    const requestTimestamp = parseInt(timestamp, 10);
    if (Date.now() - requestTimestamp > fiveMinutesInMillis) {
      console.error('HubSpot webhook timestamp is too old.');
      return false;
    }

    // 2. Construct the source string
    // NOTE: This assumes the body is parsed as JSON. For robust validation,
    // it's best to use the raw request body if available.
    const requestBody = JSON.stringify(req.body);
    const sourceString = `${req.method.toUpperCase()}${req.protocol}://${req.get('host')}${req.originalUrl}${requestBody}`;

    // 3. Create the HMAC-SHA-256 hash
    const calculatedSignature = crypto
      .createHmac('sha256', clientSecret)
      .update(sourceString)
      .digest('base64');

    // 4. Compare signatures
    return crypto.timingSafeEqual(
      Buffer.from(calculatedSignature, 'base64'),
      Buffer.from(signature, 'base64'),
    );
  }
}
