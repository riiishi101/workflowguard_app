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

  @Public()
  @Get('hubspot/initiate')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @Header('X-Content-Type-Options', 'nosniff')
  async initiateHubSpotOAuth(
    @Res() res: Response,
    @Query('returnTo') returnTo?: string,
    @Query('marketplace') marketplace?: string
  ) {
    const clientId = process.env.HUBSPOT_CLIENT_ID;
    if (!clientId) {
      console.error('❌ HubSpot client ID not configured');
      throw new HttpException('Authentication service is not properly configured', HttpStatus.SERVICE_UNAVAILABLE);
    }
    
    // Get and validate redirect URI
    let redirectUri = process.env.HUBSPOT_REDIRECT_URI;
    if (!redirectUri) {
      const isProduction = process.env.NODE_ENV === 'production';
      redirectUri = isProduction 
        ? 'https://api.workflowguard.pro/api/auth/hubspot/callback'
        : 'http://localhost:3000/api/auth/hubspot/callback';
    }

    // Validate returnTo URL to prevent open redirects
    const safeReturnTo = returnTo && returnTo.startsWith('/workflow-') ? returnTo : '/workflow-selection';
    const isMarketplaceInstall = marketplace === 'true';
    
    // Create state parameter to maintain state between request and callback
    const state = JSON.stringify({
      ts: Date.now(),
      returnTo: safeReturnTo,
      marketplaceInstall: isMarketplaceInstall,
      // Add a random string to prevent CSRF
      nonce: require('crypto').randomBytes(16).toString('hex')
    });

    // Build the OAuth URL with required parameters
    const authUrl = new URL('https://app.hubspot.com/oauth/authorize');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', [
      'contacts',
      'content',
      'automation',
      'oauth',
      'forms',
      'tickets',
      'files',
      'timeline',
      'transactions',
      'e-commerce'
    ].join(' '));
    authUrl.searchParams.append('state', encodeURIComponent(state));

    console.log('🔗 Initiating OAuth flow:', {
      clientId: clientId ? '***' : 'missing',
      redirectUri,
      returnTo: safeReturnTo,
      isMarketplaceInstall,
      stateLength: state.length
    });
    
    // Set no-cache headers to prevent caching of the redirect
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    res.header('X-Content-Type-Options', 'nosniff');
    
    // Perform the redirect
    return res.redirect(authUrl.toString());
  }

  @Public()
  @Get('hubspot/health')
  @Header('Cache-Control', 'no-store, no-cache')
  async hubspotHealthCheck() {
    const healthCheck = {
      success: true,
      message: 'HubSpot OAuth health check',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      configuration: {
        clientId: process.env.HUBSPOT_CLIENT_ID ? '***' : 'missing',
        redirectUri: process.env.HUBSPOT_REDIRECT_URI || 'using default',
        scopes: 'contacts,content,automation,oauth,forms',
      },
      endpoints: {
        authorize: '/auth/hubspot/initiate',
        callback: '/auth/hubspot/callback',
        complete: '/auth/hubspot/complete',
      },
      checks: {
        hasClientId: !!process.env.HUBSPOT_CLIENT_ID,
        hasClientSecret: !!process.env.HUBSPOT_CLIENT_SECRET,
        hasRedirectUri: !!process.env.HUBSPOT_REDIRECT_URI,
        canConnectToHubSpot: false,
        hubspotApiStatus: 'not_checked',
        error: null as string | null,
      },
    };

    // Test HubSpot API connectivity if we have the required configuration
    if (healthCheck.checks.hasClientId && healthCheck.checks.hasClientSecret) {
      try {
        // Simple ping to HubSpot's OAuth token endpoint to check connectivity
        const response = await axios.get('https://api.hubapi.com/oauth/v1/access-tokens/current', {
          headers: {
            'Authorization': `Bearer ${process.env.HUBSPOT_CLIENT_SECRET}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000, // 5 second timeout
          validateStatus: () => true, // Don't throw on non-200 status
        });

        healthCheck.checks.canConnectToHubSpot = true;
        healthCheck.checks.hubspotApiStatus = response.status === 200 ? 'operational' : `error_${response.status}`;
      } catch (error) {
        healthCheck.checks.canConnectToHubSpot = false;
        healthCheck.checks.hubspotApiStatus = 'connection_failed';
        healthCheck.checks.error = error.message;
        healthCheck.success = false;
        healthCheck.message = 'HubSpot API connection check failed';
      }
    } else {
      healthCheck.checks.hubspotApiStatus = 'missing_credentials';
    }

    // Determine overall health status
    healthCheck.success = healthCheck.checks.hasClientId && 
                         healthCheck.checks.hasClientSecret && 
                         healthCheck.checks.canConnectToHubSpot;

    if (!healthCheck.success && !healthCheck.checks.error) {
      healthCheck.message = 'HubSpot OAuth configuration issues detected';
      if (!healthCheck.checks.hasClientId) {
        healthCheck.checks.error = 'HUBSPOT_CLIENT_ID is not configured';
      } else if (!healthCheck.checks.hasClientSecret) {
        healthCheck.checks.error = 'HUBSPOT_CLIENT_SECRET is not configured';
      } else if (!healthCheck.checks.canConnectToHubSpot) {
        healthCheck.checks.error = 'Unable to connect to HubSpot API';
      }
    }

    return healthCheck;
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
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  async handleHubSpotCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    console.log('🔑 OAuth callback received', { code: !!code, state });
    
    if (!code) {
      console.error('❌ OAuth callback missing code parameter');
      return res.redirect('https://www.workflowguard.pro/auth/error?code=missing_code');
    }

    let isMarketplaceInstall = false;
    let returnTo = '/workflow-selection';
    
    if (state) {
      try {
        const stateData = JSON.parse(decodeURIComponent(state));
        isMarketplaceInstall = stateData.marketplaceInstall || false;
        returnTo = stateData.returnTo || returnTo;
        console.log('📦 State data:', { isMarketplaceInstall, returnTo });
      } catch (e) {
        console.warn('⚠️ Failed to parse state parameter, using defaults');
      }
    }

    const clientId = process.env.HUBSPOT_CLIENT_ID;
    const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
    const redirectUri = process.env.HUBSPOT_REDIRECT_URI || 'https://api.workflowguard.pro/api/auth/hubspot/callback';

    if (!clientId || !clientSecret) {
      console.error('❌ Missing HubSpot OAuth configuration');
      return res.redirect('https://www.workflowguard.pro/auth/error?code=misconfigured');
    }

    try {
      console.log('🔄 Exchanging authorization code for access token...');
      const tokenRes = await axios.post('https://api.hubapi.com/oauth/v1/token', null, {
        params: {
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code,
        },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000, // 10 second timeout
      });

      const { access_token, refresh_token, expires_in, hub_id } = tokenRes.data;
      console.log('✅ Successfully obtained access token', { hub_id });

      if (!access_token) {
        throw new Error('No access token in response');
      }

      console.log('🔍 Fetching user information from HubSpot...');
      const userRes = await axios.get('https://api.hubapi.com/integrations/v1/me', {
        headers: { 
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000, // 10 second timeout
      });

      let email = userRes.data.user || userRes.data.email || userRes.data.userEmail;
      if (!email && userRes.data.portalId) {
        email = `portal-${userRes.data.portalId}@hubspot.test`;
      }

      if (!email) {
        throw new Error('Could not determine user email from HubSpot response');
      }

      console.log('👤 Processing user authentication', { email, hub_id });
      const user = await this.authService.validateHubSpotUser({
        email,
        name: email.split('@')[0],
        portalId: hub_id,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt: new Date(Date.now() + (expires_in * 1000)),
      });

      console.log('🔑 Generating JWT token for user', { userId: user.id });
      const token = this.authService.generateToken(user);

      // Build redirect URL with token and state
      const redirectBase = 'https://www.workflowguard.pro';
      const tokenParam = `token=${encodeURIComponent(token)}`;
      const successParam = 'success=true';
      const marketplaceParam = isMarketplaceInstall ? 'marketplace=true' : '';
      const returnToPath = returnTo.startsWith('/') ? returnTo : `/${returnTo}`;
      
      // Clean up the returnTo path to prevent open redirects
      const cleanReturnTo = returnToPath.startsWith('/workflow-') ? returnToPath : '/workflow-selection';
      
      const redirectUrl = new URL(cleanReturnTo, redirectBase);
      redirectUrl.searchParams.set('auth', 'success');
      if (isMarketplaceInstall) {
        redirectUrl.searchParams.set('marketplace', 'true');
      }
      
      // Set secure, httpOnly cookie with the token
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/',
      });

      console.log('🔗 Redirecting to:', redirectUrl.toString());
      return res.redirect(redirectUrl.toString());

    } catch (error) {
      console.error('❌ OAuth callback error:', error);
      
      let errorCode = 'oauth_failed';
      let errorMessage = 'Authentication failed. Please try again.';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        
        if (error.response.status === 400) {
          errorCode = 'invalid_grant';
          errorMessage = 'Invalid or expired authorization code. Please try connecting again.';
        } else if (error.response.status === 401) {
          errorCode = 'invalid_client';
          errorMessage = 'Invalid client credentials. Please contact support.';
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        errorCode = 'no_response';
        errorMessage = 'No response from HubSpot. Please check your internet connection and try again.';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', error.message);
      }
      
      const errorUrl = new URL('https://www.workflowguard.pro/auth/error');
      errorUrl.searchParams.set('code', errorCode);
      errorUrl.searchParams.set('message', encodeURIComponent(errorMessage));
      
      return res.redirect(errorUrl.toString());
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