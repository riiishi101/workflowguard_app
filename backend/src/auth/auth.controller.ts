import { Controller, Get, Post, Body, Param, HttpException, HttpStatus, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import axios from 'axios';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('hubspot')
  async initiateHubSpotOAuth(@Res() res: Response) {
    // This would redirect to HubSpot's OAuth consent page
    const clientId = process.env.HUBSPOT_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.HUBSPOT_REDIRECT_URI || 'http://localhost:3000/auth/hubspot/callback');
    const scopes = encodeURIComponent('contacts workflows');
    
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

  @Get('/callback')
  async hubspotOAuthCallback(@Query('code') code: string, @Res() res: Response) {
    if (!code) {
      return res.status(400).json({ message: 'Missing code parameter' });
    }
    // You can add your token exchange logic here later
    return res.status(200).json({ message: 'OAuth callback received', code });
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
}
