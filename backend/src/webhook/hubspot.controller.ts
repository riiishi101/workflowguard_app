import { Controller, Post, Body, Req, Res, HttpStatus, HttpException } from '@nestjs/common';
import { HubspotService } from './hubspot.service';
import { Request, Response } from 'express';

@Controller('webhooks/hubspot')
export class HubspotController {
  constructor(private readonly hubspotService: HubspotService) {}

  @Post()
  async handleHubspotWebhook(@Req() req: Request, @Res() res: Response, @Body() body: any[]) {
    // HubSpot sends an array of events
    console.log('Received HubSpot Webhook:', JSON.stringify(body, null, 2));
    
    // It's good practice to verify the webhook signature first
    // const signature = req.headers['x-hubspot-signature-v3'] as string;
    // if (!this.hubspotService.isSignatureValid(signature, JSON.stringify(body))) {
    //   throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED);
    // }

    try {
      // Process each event in the payload
      for (const event of body) {
        await this.hubspotService.processWebhookEvent(event);
      }

      res.status(HttpStatus.NO_CONTENT).send();
    } catch (error) {
      console.error('Error processing HubSpot webhook:', error);
      throw new HttpException('Error processing webhook', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
