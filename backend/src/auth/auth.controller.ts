import { Controller, Get, Post, Body, Param, HttpException, HttpStatus, Query, Res, UseGuards, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import axios from 'axios';
import { Public } from './public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  @Public()
  @Get('hubspot')
  async initiateHubSpotOAuth(@Res() res: Response) {
    // This would redirect to HubSpot's OAuth consent page
    const clientId = process.env.HUBSPOT_CLIENT_ID;
    // Use the callback endpoint that sets JWT cookies
    const redirectUri = encodeURIComponent(process.env.HUBSPOT_REDIRECT_URI || 'https://www.workflowguard.pro/api/auth/callback');
    const scopes = encodeURIComponent('crm.objects.companies.read crm.objects.contacts.read crm.objects.deals.read crm.schemas.companies.read crm.schemas.contacts.read crm.schemas.deals.read oauth');
    const state = encodeURIComponent('workflowguard-oauth-' + Date.now());
    
    const authUrl = `https://app.hubspot.com/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}`;
    
    console.log('OAuth initiation - Redirecting to:', authUrl);
    res.redirect(authUrl);
  }

  @Public()
  @Get('/callback')
  async hubspotOAuthCallback(@Query('code') code: string, @Query('state') state: string, @Query() allQueryParams: any, @Req() req: Request, @Res() res: Response) {
    console.log('OAuth callback called with code:', code ? 'present' : 'missing');
    console.log('OAuth callback - State parameter:', state);
    console.log('OAuth callback - All query parameters:', allQueryParams);
    console.log('OAuth callback - Request headers:', req.headers);
    console.log('OAuth callback - Request URL:', req.url);
    
    if (!code) {
      const frontendUrl = process.env.VERCEL_FRONTEND_URL || 'http://localhost:5173';
      const errorMsg = encodeURIComponent('Missing code parameter. Please try connecting to HubSpot again from the app.');
      return res.redirect(`${frontendUrl}/?oauth_error=${errorMsg}`);
    }

    try {
      console.log('OAuth callback: Starting token exchange...');
      // Exchange code for access token
      let tokenRes;
      try {
        tokenRes = await axios.post('https://api.hubapi.com/oauth/v1/token', null, {
        params: {
          grant_type: 'authorization_code',
          client_id: process.env.HUBSPOT_CLIENT_ID,
          client_secret: process.env.HUBSPOT_CLIENT_SECRET,
          redirect_uri: process.env.HUBSPOT_REDIRECT_URI,
          code,
        },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      } catch (tokenErr) {
        const frontendUrl = process.env.VERCEL_FRONTEND_URL || 'http://localhost:5173';
        const errorMsg = encodeURIComponent('Failed to exchange code for access token. Please try again or contact support.');
        return res.redirect(`${frontendUrl}/?oauth_error=${errorMsg}`);
      }

      console.log('OAuth callback: Token exchange successful');
      const { access_token, refresh_token, expires_in } = tokenRes.data;

      // Fetch user email and portalId from HubSpot
      let userRes;
      try {
        userRes = await axios.get('https://api.hubapi.com/integrations/v1/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      } catch (userErr) {
        const frontendUrl = process.env.VERCEL_FRONTEND_URL || 'http://localhost:5173';
        const errorMsg = encodeURIComponent('Failed to fetch user info from HubSpot. Please try again or contact support.');
        return res.redirect(`${frontendUrl}/?oauth_error=${errorMsg}`);
      }
      const email = userRes.data.user || userRes.data.email;
      const portalId = userRes.data.portalId;

      let user;
      try {
      if (!email && portalId) {
        // Use portalId as a fallback unique identifier (synthetic email)
        const syntheticEmail = `portal-${portalId}@hubspot.test`;
        user = await this.authService.findOrCreateUser(syntheticEmail);
        await this.authService.updateUserHubspotTokens(user.id, access_token, refresh_token, expires_in);
        await this.authService.updateUserLastActive(user.id);
      } else if (!email) {
          const frontendUrl = process.env.VERCEL_FRONTEND_URL || 'http://localhost:5173';
          const errorMsg = encodeURIComponent('Could not retrieve user email or portalId from HubSpot. Please try again or contact support.');
          return res.redirect(`${frontendUrl}/?oauth_error=${errorMsg}`);
      } else {
        // Find or create user in your DB
        user = await this.authService.findOrCreateUser(email);
        console.log('OAuth - User found/created:', user.email, 'User ID:', user.id);
        await this.authService.updateUserHubspotTokens(user.id, access_token, refresh_token, expires_in);
        console.log('OAuth - HubSpot tokens updated for user:', user.email);
        await this.authService.updateUserLastActive(user.id);
        }
      } catch (userDbErr) {
        const frontendUrl = process.env.VERCEL_FRONTEND_URL || 'http://localhost:5173';
        const errorMsg = encodeURIComponent('Failed to create or update user in the database. Please try again or contact support.');
        return res.redirect(`${frontendUrl}/?oauth_error=${errorMsg}`);
      }

      // Update user's HubSpot portal ID and tokens
      try {
      if (portalId) {
        await this.authService.updateUserHubspotPortalId(user.id, portalId.toString());
      }
      await this.authService.updateUserHubspotTokens(user.id, access_token, refresh_token, expires_in);
      console.log('OAuth - HubSpot tokens updated for user:', user.email);
      } catch (tokenDbErr) {
        const frontendUrl = process.env.VERCEL_FRONTEND_URL || 'http://localhost:5173';
        const errorMsg = encodeURIComponent('Failed to update user tokens. Please try again or contact support.');
        return res.redirect(`${frontendUrl}/?oauth_error=${errorMsg}`);
      }

      // Update user's plan to include hubspot_connected feature
      try {
        const userPlan = await this.userService.getUserPlan(user.id);
        if (userPlan) {
          console.log('OAuth - User has plan:', userPlan.planId);
          // For now, we'll just log this. The frontend will handle the plan update
        }
      } catch (planError) {
        console.log('OAuth - Could not get user plan:', planError);
        // Continue with OAuth flow even if plan update fails
      }

      // Generate JWT
      let jwt;
      try {
        jwt = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
      console.log('Generated JWT for user:', user.email, 'JWT length:', jwt.length, 'User ID in JWT:', user.id);
      } catch (jwtErr) {
        const frontendUrl = process.env.VERCEL_FRONTEND_URL || 'http://localhost:5173';
        const errorMsg = encodeURIComponent('Failed to generate authentication token. Please try again or contact support.');
        return res.redirect(`${frontendUrl}/?oauth_error=${errorMsg}`);
      }

      // Set JWT as HttpOnly, Secure cookie
      const isProduction = process.env.NODE_ENV === 'production';
      try {
      res.cookie('jwt', jwt, {
        httpOnly: true,
        secure: isProduction, // true in production, false in development
        sameSite: 'none', // Allow cross-site cookies
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
        // Remove domain restriction to allow cross-domain cookies to work properly
      });
      console.log('JWT cookie set successfully');
      } catch (cookieErr) {
        const frontendUrl = process.env.VERCEL_FRONTEND_URL || 'http://localhost:5173';
        const errorMsg = encodeURIComponent('Failed to set authentication cookie. Please try again or contact support.');
        return res.redirect(`${frontendUrl}/?oauth_error=${errorMsg}`);
      }

      // Optionally, you can also send user info as a query param or just redirect
      console.log('Redirecting to dashboard...');
      return res.redirect('https://www.workflowguard.pro/dashboard');
    } catch (error) {
      const frontendUrl = process.env.VERCEL_FRONTEND_URL || 'http://localhost:5173';
      const errorMsg = encodeURIComponent('Unexpected error during HubSpot connection. Please try again or contact support.');
      return res.redirect(`${frontendUrl}/?oauth_error=${errorMsg}`);
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

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: Request) {
    // req.user is set by JwtStrategy
    console.log('GET /me - User from JWT:', req.user);
    console.log('GET /me - Cookies:', req.cookies);
    return { user: req.user };
  }

  @Public()
  @Post('logout')
  async logout(@Res() res: Response) {
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'none', // Allow cross-site cookies
      path: '/',
      // No domain restriction to allow cross-domain cookies
    });
    return res.json({ message: 'Logged out successfully' });
  }

  @Post('hubspot/deauthorize')
  async handleHubspotDeauth(@Body() body: any, @Res() res: any) {
    // TODO: Validate the request (e.g., check client secret or signature if required by HubSpot)
    const { portalId, userId } = body;
    if (!portalId) {
      return res.status(400).json({ message: 'Missing portalId in request body' });
    }
    try {
      const result = await this.authService.handleHubspotDeauth(portalId, userId);
      console.log(`Received HubSpot deauthorization for portalId: ${portalId}, userId: ${userId}`);
      return res.status(200).json(result);
    } catch (err) {
      console.error('Error handling HubSpot deauthorization:', err);
      return res.status(500).json({ message: 'Failed to handle deauthorization', error: err.message });
    }
  }
}
