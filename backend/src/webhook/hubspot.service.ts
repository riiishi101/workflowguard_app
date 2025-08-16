import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HubspotService {
  constructor(private prisma: PrismaService) {}

  async processWebhookEvent(event: any) {
    console.log(`Processing event: ${event.subscriptionType}`);

    switch (event.subscriptionType) {
      case 'workflow.creation':
        // Handle workflow creation event
        console.log('A new workflow was created:', event);
        // Example: await this.prisma.auditLog.create(...);
        break;
      case 'workflow.deletion':
        // Handle workflow deletion event
        console.log('A workflow was deleted:', event);
        break;
      case 'workflow.propertyChange':
        // Handle workflow property change event
        console.log('A workflow property was changed:', event);
        break;
      default:
        console.log(`Unhandled event type: ${event.subscriptionType}`);
    }
  }

  // isSignatureValid(signature: string, body: string): boolean {
  //   const secret = process.env.HUBSPOT_CLIENT_SECRET;
  //   const hash = require('crypto')
  //     .createHmac('sha256', secret)
  //     .update(body)
  //     .digest('base64');

  //   return signature === hash;
  // }
}
