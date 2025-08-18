import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import axios from 'axios';

@Controller('auth/hubspot')
export class HubspotController {
  // Replace with your actual client_id, client_secret, and redirect_uri
  private readonly client_id = process.env.HUBSPOT_CLIENT_ID || 'YOUR_CLIENT_ID';
  private readonly client_secret = process.env.HUBSPOT_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';
  private readonly redirect_uri = process.env.HUBSPOT_REDIRECT_URI || 'YOUR_REDIRECT_URI';

  @Get('callback')
  async hubspotCallback(@Query('code') code: string, @Res() res: Response) {
    if (!code) {
      return res.status(400).json({ error: 'Missing authorization code from HubSpot.' });
    }

    try {
      // Exchange code for tokens with HubSpot
      const tokenResponse = await axios.post('https://api.hubapi.com/oauth/v1/token', null, {
        params: {
          grant_type: 'authorization_code',
          client_id: this.client_id,
          client_secret: this.client_secret,
          redirect_uri: this.redirect_uri,
          code,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      // TODO: Handle/store tokens in your database
      // For demonstration, we just send them in the response
      return res.status(200).json({
        message: 'HubSpot OAuth successful!',
        tokens: tokenResponse.data,
      });
    } catch (error: any) {
      // Handle error from HubSpot
      return res.status(500).json({
        message: 'Failed to exchange code for tokens with HubSpot.',
        error: error?.response?.data || error.message,
      });
    }
  }
}
