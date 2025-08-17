import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { HubspotService } from './hubspot.service';
import { HubspotEventDto } from './dto/hubspot-event.dto';
import { Request, Response } from 'express';

@Controller('webhooks/hubspot')
export class HubspotController {
  constructor(private readonly hubspotService: HubspotService) {}

  @Post()
  async handleHubspotWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: HubspotEventDto[],
  ) {
    // HubSpot sends an array of events
    console.log('Received HubSpot Webhook:', JSON.stringify(body, null, 2));

    // Verify the webhook signature
    if (!this.hubspotService.isSignatureValid(req)) {
      throw new HttpException(
        'Invalid HubSpot signature',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      // Process each event in the payload
      for (const event of body) {
        await this.hubspotService.processWebhookEvent(event);
      }

      res.status(HttpStatus.NO_CONTENT).send();
    } catch (error) {
      console.error('Error processing HubSpot webhook:', error);
      throw new HttpException(
        'Error processing webhook',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
