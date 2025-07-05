import { Controller, Get, Post, Body, Param, HttpException, HttpStatus, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import axios from 'axios';
import { Public } from './public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('hubspot')
  async initiateHubSpotOAuth(@Res() res: Response) {
    // This would redirect to HubSpot's OAuth consent page
    const clientId = process.env.HUBSPOT_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.HUBSPOT_REDIRECT_URI || 'http://localhost:3000/auth/hubspot/callback');
    const scopes = encodeURIComponent('crm.objects.companies.read crm.objects.contacts.read crm.objects.deals.read crm.schemas.companies.read crm.schemas.contacts.read crm.schemas.deals.read oauth');
    
    const authUrl = `https://app.hubspot.com/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}`;
    
    res.redirect(authUrl);
  }

  @Get('hubspot/callback')
  async handleHubSpotCallback(@Query('code') code: string, @Query('state') state: string) {
    try {
      if (!code) {
        throw new HttpException('Authorization code not provided', HttpStatus.BAD_REQUEST);
      }

      // 1. Exchange code for tokens
      const tokenRes = await axios.post('https://api.hubapi.com/oauth/v1/token', null, {
        params: {
          grant_type: 'authorization_code',
          client_id: process.env.HUBSPOT_CLIENT_ID,
          client_secret: process.env.HUBSPOT_CLIENT_SECRET,
          redirect_uri: process.env.HUBSPOT_REDIRECT_URI,
          code,
        },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const { access_token, refresh_token, hub_id } = tokenRes.data;

      // 2. Fetch user email from HubSpot
      const userRes = await axios.get('https://api.hubapi.com/integrations/v1/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const email = userRes.data.user || userRes.data.email;

      // 3. Create or update user in your DB with hubspotPortalId
      const user = await this.authService.findOrCreateUser(email);
      await this.authService.updateUserHubspotPortalId(user.id, hub_id);

      // 4. (Optional) Create session/JWT, redirect, etc.
      return {
        message: 'OAuth callback received',
        hub_id,
        email,
        // ...other info...
      };
    } catch (error) {
      throw new HttpException('OAuth callback failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Public()
  @Get('/callback')
  async hubspotOAuthCallback(@Query('code') code: string, @Res() res: Response) {
    if (!code) {
      return res.status(400).json({ message: 'Missing code parameter' });
    }

    try {
      // Exchange code for access token
      const tokenRes = await axios.post('https://api.hubapi.com/oauth/v1/token', null, {
        params: {
          grant_type: 'authorization_code',
          client_id: process.env.HUBSPOT_CLIENT_ID,
          client_secret: process.env.HUBSPOT_CLIENT_SECRET,
          redirect_uri: process.env.HUBSPOT_REDIRECT_URI,
          code,
        },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const { access_token, refresh_token, expires_in } = tokenRes.data;

      // Fetch user email and portalId from HubSpot
      const userRes = await axios.get('https://api.hubapi.com/integrations/v1/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const email = userRes.data.user || userRes.data.email;
      const portalId = userRes.data.portalId;

      if (!email && portalId) {
        // Use portalId as a fallback unique identifier (synthetic email)
        const syntheticEmail = `portal-${portalId}@hubspot.test`;
        const user = await this.authService.findOrCreateUser(syntheticEmail);
        await this.authService.updateUserHubspotTokens(user.id, access_token, refresh_token, expires_in);
        return res.redirect('https://www.workflowguard.pro/dashboard');
      }

      if (!email) {
        // Log the HubSpot response for debugging
        console.error('HubSpot /integrations/v1/me response:', userRes.data);
        return res.status(400).json({ message: 'Could not retrieve user email or portalId from HubSpot', hubspotResponse: userRes.data });
      }

      // Find or create user in your DB
      const user = await this.authService.findOrCreateUser(email);
      await this.authService.updateUserHubspotTokens(user.id, access_token, refresh_token, expires_in);
      return res.redirect('https://www.workflowguard.pro/dashboard');
    } catch (error) {
      return res.status(500).json({ message: 'Token exchange or storage failed', error: error.response?.data || error.message });
    }
  }

  @Post('validate')
  async validateUser(@Body() body: { email: string }) {
    try {
      const user = await this.authService.validateUser(body.email);
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      return user;
    } catch (error) {
      throw new HttpException('User validation failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    try {
      return await this.authService.login(body.email, body.password);
    } catch (error) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
  }

  @Post('register')
  async registerUser(@Body() body: { email: string; name?: string; role?: string; password?: string }) {
    try {
      return await this.authService.createUser(body.email, body.name, body.role, body.password);
    } catch (error) {
      throw new HttpException('User registration failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('user/:email')
  async findOrCreateUser(@Param('email') email: string) {
    try {
      return await this.authService.findOrCreateUser(email);
    } catch (error) {
      throw new HttpException('Failed to find or create user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('hubspot-contacts/:email')
  async getHubspotContacts(@Param('email') email: string, @Res() res: Response) {
    try {
      // Find user by email
      const user = await this.authService.validateUser(email);
      if (!user || !user.hubspotAccessToken) {
        return res.status(404).json({ message: 'User or HubSpot access token not found' });
      }

      // Fetch contacts from HubSpot
      const hubspotRes = await axios.get('https://api.hubapi.com/crm/v3/objects/contacts', {
        headers: { Authorization: `Bearer ${user.hubspotAccessToken}` },
      });

      return res.status(200).json({ contacts: hubspotRes.data });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch contacts from HubSpot', error: error.response?.data || error.message });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('hubspot-companies/:email')
  async getHubspotCompanies(@Param('email') email: string, @Res() res: Response) {
    try {
      const user = await this.authService.validateUser(email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      // Get a valid (refreshed if needed) access token
      const accessToken = await this.authService.getValidHubspotAccessToken(user);
      const hubspotRes = await axios.get('https://api.hubapi.com/crm/v3/objects/companies', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.status(200).json({ companies: hubspotRes.data });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch companies from HubSpot', error: error.response?.data || error.message });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('hubspot-deals/:email')
  async getHubspotDeals(@Param('email') email: string, @Res() res: Response) {
    try {
      const user = await this.authService.validateUser(email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      const accessToken = await this.authService.getValidHubspotAccessToken(user);
      const hubspotRes = await axios.get('https://api.hubapi.com/crm/v3/objects/deals', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.status(200).json({ deals: hubspotRes.data });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch deals from HubSpot', error: error.response?.data || error.message });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('hubspot-contacts/:email')
  async createHubspotContact(@Param('email') email: string, @Body() body: any, @Res() res: Response) {
    try {
      const user = await this.authService.validateUser(email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      const accessToken = await this.authService.getValidHubspotAccessToken(user);
      // Use provided body or sample data
      const contactData = body && Object.keys(body).length > 0 ? body : {
        properties: {
          email: `test${Date.now()}@example.com`,
          firstname: 'Test',
          lastname: 'Contact',
        }
      };
      const hubspotRes = await axios.post('https://api.hubapi.com/crm/v3/objects/contacts', contactData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.status(201).json({ contact: hubspotRes.data });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to create contact in HubSpot', error: error.response?.data || error.message });
    }
  }
}
