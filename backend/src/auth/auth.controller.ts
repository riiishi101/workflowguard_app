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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { Response, Request } from 'express';
import axios from 'axios';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: Request) {
    // Return the authenticated user's profile
    return req.user;
  }

  @Public()
  @Get('hubspot/url')
  async getHubSpotAuthUrl(@Query('marketplace') marketplace?: string) {
    try {
      const clientId = process.env.HUBSPOT_CLIENT_ID;
      const redirectUri =
        process.env.HUBSPOT_REDIRECT_URI ||
        'https://api.workflowguard.pro/api/auth/hubspot/callback';

      // Use marketplace-specific scopes if coming from marketplace
      const scopes =
        marketplace === 'true'
          ? 'crm.schemas.deals.read automation oauth crm.objects.companies.read crm.objects.deals.read crm.schemas.contacts.read crm.objects.contacts.read crm.schemas.companies.read marketplace'
          : 'crm.schemas.deals.read automation oauth crm.objects.companies.read crm.objects.deals.read crm.schemas.contacts.read crm.objects.contacts.read crm.schemas.companies.read';

      // Debug logging
      console.log('HUBSPOT_CLIENT_ID:', clientId);
      console.log('HUBSPOT_REDIRECT_URI:', redirectUri);
      console.log('Marketplace installation:', marketplace);

      let authUrl;

      if (!clientId) {
        // Fallback to known working URL for testing
        console.log('Using fallback OAuth URL');
        authUrl =
          'https://app-na2.hubspot.com/oauth/authorize?client_id=6be1632d-8007-45e4-aecb-6ec93e6ff528&redirect_uri=https://api.workflowguard.pro/api/auth/hubspot/callback&scope=crm.schemas.deals.read%20automation%20oauth%20crm.objects.companies.read%20crm.objects.deals.read%20crm.schemas.contacts.read%20crm.objects.contacts.read%20crm.schemas.companies.read';
      } else {
        authUrl = `https://app-na2.hubspot.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
      }

      console.log('Generated OAuth URL:', authUrl);

      return { url: authUrl };
    } catch (error) {
      console.error('Error generating HubSpot OAuth URL:', error);
      throw new HttpException(
        'Failed to generate HubSpot OAuth URL',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('hubspot')
  async initiateHubSpotOAuth(@Res() res: Response) {
    // This would redirect to HubSpot's OAuth consent page
    const clientId = process.env.HUBSPOT_CLIENT_ID;
    const redirectUri = encodeURIComponent(
      process.env.HUBSPOT_REDIRECT_URI ||
        'http://localhost:3000/auth/hubspot/callback',
    );
    // Use only valid scopes (no deprecated 'contacts')
    const scopes = encodeURIComponent(
      'automation oauth crm.objects.companies.read crm.objects.contacts.read crm.objects.deals.read crm.schemas.companies.read crm.schemas.contacts.read crm.schemas.deals.read',
    );

    const authUrl = `https://app.hubspot.com/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}`;

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
        url: '/api/auth/hubspot/url'
      }
    };
  }

  @Public()
  @Get('hubspot/callback')
  async handleHubSpotCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    // Set CORS headers for the OAuth callback
    res.header('Access-Control-Allow-Origin', 'https://www.workflowguard.pro');
    res.header('Access-Control-Allow-Credentials', 'true');
    try {
      console.log('HubSpot callback received with code:', code);

      if (!code) {
        console.error('No authorization code provided');
        return res.redirect('https://www.workflowguard.pro?error=no_code');
      }

      // Parse state to check if this is a marketplace installation
      let isMarketplaceInstall = false;

      if (state) {
        try {
          const stateData = JSON.parse(decodeURIComponent(state));
          isMarketplaceInstall = stateData.marketplaceInstall || false;
        } catch (e) {
          console.log('Could not parse state, treating as regular OAuth');
        }
      }

      // Full OAuth flow with proper environment variables
      const clientId =
        process.env.HUBSPOT_CLIENT_ID || '6be1632d-8007-45e4-aecb-6ec93e6ff528';
      const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
      const redirectUri =
        process.env.HUBSPOT_REDIRECT_URI ||
        'https://api.workflowguard.pro/api/auth/hubspot/callback';

      console.log('Using clientId:', clientId);
      console.log('Using redirectUri:', redirectUri);
      console.log('Client secret available:', !!clientSecret);
      console.log('Marketplace installation:', isMarketplaceInstall);

      if (!clientSecret) {
        console.error('HUBSPOT_CLIENT_SECRET is not set');
        return res.redirect('https://www.workflowguard.pro?error=config_error');
      }

      // 1. Exchange code for tokens
      console.log('Exchanging code for tokens...');
      const tokenRes = await axios.post(
        'https://api.hubapi.com/oauth/v1/token',
        null,
        {
          params: {
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            code,
          },
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );

      console.log('Token response received:', !!tokenRes.data);
      const { access_token, refresh_token, hub_id } = tokenRes.data;
      console.log('Token exchange successful, hub_id:', hub_id);

      if (!access_token) {
        console.error('No access token received from HubSpot');
        return res.redirect('https://www.workflowguard.pro?error=token_error');
      }

      // 2. Fetch user email from HubSpot
      console.log('Fetching user info from HubSpot...');
      const userRes = await axios.get(
        'https://api.hubapi.com/integrations/v1/me',
        {
          headers: { Authorization: `Bearer ${access_token}` },
        },
      );

      console.log('User response received:', !!userRes.data);
      console.log('User response data:', JSON.stringify(userRes.data, null, 2));

      // Try different possible email fields
      let email =
        userRes.data.user || userRes.data.email || userRes.data.userEmail;

      // If no email found, use portalId as email (convert to string)
      if (!email && userRes.data.portalId) {
        email = `portal-${userRes.data.portalId}@hubspot.test`;
      }

      console.log('User email from HubSpot:', email);

      if (!email) {
        console.error('No email found in HubSpot user response');
        console.error('Available fields:', Object.keys(userRes.data));
        return res.redirect('https://www.workflowguard.pro?error=user_error');
      }

      // 3. Create or update user in your DB with hubspotPortalId and tokens
      console.log('Creating/updating user in database...');
      let user;
      try {
        // Ensure we have all required data before attempting user creation
        if (!email) {
          console.error('Missing email from HubSpot response');
          return res.redirect('https://www.workflowguard.pro?error=missing_email');
        }
        
        if (!hub_id) {
          console.error('Missing portal ID from HubSpot response');
          return res.redirect('https://www.workflowguard.pro?error=missing_portal_id');
        }
        
        if (!access_token) {
          console.error('Missing access token from HubSpot response');
          return res.redirect('https://www.workflowguard.pro?error=missing_token');
        }
        
        user = await this.authService.validateHubSpotUser({
          email,
          name: email.split('@')[0], // Use email prefix as name
          portalId: hub_id,
          accessToken: access_token,
          refreshToken: refresh_token,
          tokenExpiresAt: new Date(
            Date.now() + tokenRes.data.expires_in * 1000,
          ),
        });
        console.log('User found/created:', user.id);
      } catch (dbError) {
        console.error('Database operation failed:', dbError);
        
        // Provide more specific error messages based on the error
        const errorMessage = dbError.message || 'Unknown error';
        console.error('Error details:', errorMessage);
        
        if (errorMessage.includes('email already exists')) {
          return res.redirect('https://www.workflowguard.pro?error=email_already_exists');
        } else if (errorMessage.includes('Missing required email')) {
          return res.redirect('https://www.workflowguard.pro?error=missing_email');
        } else if (errorMessage.includes('Missing required portalId')) {
          return res.redirect('https://www.workflowguard.pro?error=missing_portal_id');
        }
        
        // If all else fails, redirect with error
        return res.redirect(
          'https://www.workflowguard.pro?error=user_creation_failed',
        );
      }

      // 4. Generate JWT token for the user
      const token = this.authService.generateToken(user);
      console.log('JWT token generated for user:', user.id);
      console.log(
        'Generated token (first 50 chars):',
        token.substring(0, 50) + '...',
      );

      // 5. Redirect based on installation type
      if (isMarketplaceInstall) {
        // For marketplace installations, redirect to dashboard with success
        console.log('Marketplace installation completed successfully');
        const redirectUrl = `https://www.workflowguard.pro?success=true&token=${encodeURIComponent(token)}&marketplace=true`;
        console.log('Redirecting to marketplace success:', redirectUrl);
        return res.redirect(redirectUrl);
      } else {
        // For regular OAuth, redirect to frontend with success and token
        console.log('OAuth callback completed successfully');
        const redirectUrl = `https://www.workflowguard.pro/workflow-selection?success=true&token=${encodeURIComponent(token)}`;
        console.log('Redirecting to:', redirectUrl);
        return res.redirect(redirectUrl);
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      console.error('Error stack:', error.stack);

      // Log more details about the error
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
        console.error('Error response headers:', error.response.headers);
      }

      if (error.request) {
        console.error('Error request:', error.request);
      }

      console.error('Error message:', error.message);
      console.error('Error name:', error.name);

      return res.redirect('https://www.workflowguard.pro?error=oauth_failed');
    }
  }

  @Post('validate')
  async validateUser(@Body() body: { email: string; password: string }) {
    try {
      const user = await this.authService.validateUser(
        body.email,
        body.password,
      );
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      return user;
    } catch (error) {
      throw new HttpException(
        'User validation failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    try {
      const user = await this.authService.validateUser(
        body.email,
        body.password,
      );
      if (!user) {
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }
      return await this.authService.login(user);
    } catch (error) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
  }

  @Post('register')
  async register(@Body() createUserDto: any) {
    try {
      const user = await this.authService.register(createUserDto);
      return await this.authService.login(user);
    } catch (error) {
      throw new HttpException(
        'Registration failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Req() req: Request) {
    try {
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
    } catch (error) {
      throw new HttpException(
        'Failed to get current user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
