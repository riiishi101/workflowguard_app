import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
  Header,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { Response, Request } from 'express';
import axios from 'axios';
import { Public } from './public.decorator';

const OAUTH_SCOPES = {
  STANDARD: 'crm.schemas.deals.read automation oauth crm.objects.companies.read crm.objects.deals.read crm.schemas.contacts.read crm.objects.contacts.read crm.schemas.companies.read',
  MARKETPLACE: 'crm.schemas.deals.read automation oauth crm.objects.companies.read crm.objects.deals.read crm.schemas.contacts.read crm.objects.contacts.read crm.schemas.companies.read marketplace'
};

interface CreateUserDto {
  email: string;
  password: string;
  name?: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: Request) {
    return req.user;
  }

  @Public()
  @Get('hubspot/url')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  async getHubSpotAuthUrl(@Query('marketplace') marketplace?: string) {
    const clientId = process.env.HUBSPOT_CLIENT_ID;
    const redirectUri = process.env.HUBSPOT_REDIRECT_URI || 'https://api.workflowguard.pro/api/auth/hubspot/callback';

    if (!clientId) {
      throw new HttpException('HubSpot client ID not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const scopes = marketplace === 'true' ? OAUTH_SCOPES.MARKETPLACE : OAUTH_SCOPES.STANDARD;
    const authUrl = `https://app-na2.hubspot.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;

    return { url: authUrl };
  }

  @Get('hubspot')
  async initiateHubSpotOAuth(@Res() res: Response) {
    const clientId = process.env.HUBSPOT_CLIENT_ID;
    
    if (!clientId) {
      throw new HttpException('HubSpot client ID not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
    const redirectUri = encodeURIComponent(process.env.HUBSPOT_REDIRECT_URI || 'http://localhost:3000/auth/hubspot/callback');
    const scopes = encodeURIComponent(OAUTH_SCOPES.STANDARD);
    const authUrl = `https://app-na2.hubspot.com/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}`;

    res.redirect(authUrl);
  }

  @Public()
  @Get('hubspot/health')
  async hubspotHealthCheck() {
    return {
      success: true,
      message: 'HubSpot OAuth endpoints are healthy',
      timestamp: new Date().toISOString(),
      endpoints: {
        callback: '/api/auth/hubspot/callback',
        url: '/api/auth/hubspot/url',
        complete: '/api/auth/hubspot/complete'
      }
    };
  }

  @Public()
  @Post('hubspot/complete')
  async completeHubSpotOAuth(@Body() body: { code: string }) {
    const { code } = body;
    
    if (!code) {
      throw new HttpException('Authorization code is required', HttpStatus.BAD_REQUEST);
    }

    const clientId = process.env.HUBSPOT_CLIENT_ID;
    const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
    const redirectUri = process.env.HUBSPOT_REDIRECT_URI || 'https://api.workflowguard.pro/api/auth/hubspot/callback';

    if (!clientSecret) {
      throw new HttpException('HubSpot configuration error', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const tokenRes = await axios.post('https://api.hubapi.com/oauth/v1/token', null, {
      params: {
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const { access_token, refresh_token, hub_id } = tokenRes.data;

    const userRes = await axios.get('https://api.hubapi.com/integrations/v1/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    let email = userRes.data.user || userRes.data.email || userRes.data.userEmail;
    if (!email && userRes.data.portalId) {
      email = `portal-${userRes.data.portalId}@hubspot.test`;
    }

    if (!email) {
      throw new HttpException('Unable to retrieve user email from HubSpot', HttpStatus.BAD_REQUEST);
    }

    const user = await this.authService.validateHubSpotUser({
      email,
      name: email.split('@')[0],
      portalId: hub_id,
      accessToken: access_token,
      refreshToken: refresh_token,
      tokenExpiresAt: new Date(Date.now() + tokenRes.data.expires_in * 1000),
    });

    const token = this.authService.generateToken(user);

    return {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
    };
  }

  @Public()
  @Get('hubspot/callback')
  async handleHubSpotCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    res.header('Access-Control-Allow-Origin', 'https://www.workflowguard.pro');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (!code) {
      return res.redirect('https://www.workflowguard.pro?error=no_code');
    }

    let isMarketplaceInstall = false;
    if (state) {
      try {
        const stateData = JSON.parse(decodeURIComponent(state));
        isMarketplaceInstall = stateData.marketplaceInstall || false;
      } catch (e) {
        // Continue with regular OAuth
      }
    }

    const clientId = process.env.HUBSPOT_CLIENT_ID;
    const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
    const redirectUri = process.env.HUBSPOT_REDIRECT_URI || 'https://api.workflowguard.pro/api/auth/hubspot/callback';

    if (!clientSecret) {
      return res.redirect('https://www.workflowguard.pro?error=config_error');
    }

    try {
      const tokenRes = await axios.post('https://api.hubapi.com/oauth/v1/token', null, {
        params: {
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code,
        },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const { access_token, refresh_token, hub_id } = tokenRes.data;

      if (!access_token) {
        return res.redirect('https://www.workflowguard.pro?error=token_error');
      }

      const userRes = await axios.get('https://api.hubapi.com/integrations/v1/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      let email = userRes.data.user || userRes.data.email || userRes.data.userEmail;
      if (!email && userRes.data.portalId) {
        email = `portal-${userRes.data.portalId}@hubspot.test`;
      }

      if (!email) {
        return res.redirect('https://www.workflowguard.pro?error=user_error');
      }

      const user = await this.authService.validateHubSpotUser({
        email,
        name: email.split('@')[0],
        portalId: hub_id,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokenRes.data.expires_in * 1000),
      });

      const token = this.authService.generateToken(user);

      const redirectUrl = isMarketplaceInstall 
        ? `https://www.workflowguard.pro?success=true&token=${encodeURIComponent(token)}&marketplace=true`
        : `https://www.workflowguard.pro/workflow-selection?success=true&token=${encodeURIComponent(token)}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      return res.redirect('https://www.workflowguard.pro?error=oauth_failed');
    }
  }

  @Post('validate')
  async validateUser(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
    return user;
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
    return await this.authService.login(user);
  }

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    try {
      const user = await this.authService.register(createUserDto);
      return await this.authService.login(user);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new HttpException('Email already exists', HttpStatus.CONFLICT);
      }
      throw new HttpException(error.message || 'Registration failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Req() req: Request) {
    const userId = (req.user as any)?.sub || (req.user as any)?.id;
    if (!userId) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        hubspotPortalId: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return {
      success: true,
      data: user,
    };
  }
}