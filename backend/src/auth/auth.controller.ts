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
    const redirectUri = encodeURIComponent(process.env.HUBSPOT_REDIRECT_URI || 'https://workflowguard-app.onrender.com/api/auth/callback');
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
      console.log('OAuth callback: Missing code parameter');
      return res.status(400).json({ message: 'Missing code parameter' });
    }

    try {
      console.log('OAuth callback: Starting token exchange...');
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

      console.log('OAuth callback: Token exchange successful');
      const { access_token, refresh_token, expires_in } = tokenRes.data;

      // Fetch user email and portalId from HubSpot
      const userRes = await axios.get('https://api.hubapi.com/integrations/v1/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const email = userRes.data.user || userRes.data.email;
      const portalId = userRes.data.portalId;

      let user;
      if (!email && portalId) {
        // Use portalId as a fallback unique identifier (synthetic email)
        const syntheticEmail = `portal-${portalId}@hubspot.test`;
        user = await this.authService.findOrCreateUser(syntheticEmail);
        await this.authService.updateUserHubspotTokens(user.id, access_token, refresh_token, expires_in);
      } else if (!email) {
        // Log the HubSpot response for debugging
        console.error('HubSpot /integrations/v1/me response:', userRes.data);
        return res.status(400).json({ message: 'Could not retrieve user email or portalId from HubSpot', hubspotResponse: userRes.data });
      } else {
        // Find or create user in your DB
        user = await this.authService.findOrCreateUser(email);
        console.log('OAuth - User found/created:', user.email, 'User ID:', user.id);
        await this.authService.updateUserHubspotTokens(user.id, access_token, refresh_token, expires_in);
        console.log('OAuth - HubSpot tokens updated for user:', user.email);
      }

      // Update user's HubSpot portal ID and tokens
      if (portalId) {
        await this.authService.updateUserHubspotPortalId(user.id, portalId.toString());
      }
      await this.authService.updateUserHubspotTokens(user.id, access_token, refresh_token, expires_in);
      console.log('OAuth - HubSpot tokens updated for user:', user.email);

      // Update user's plan to include hubspot_connected feature
      try {
        const userPlan = await this.userService.getUserPlan(user.id);
        if (userPlan) {
          console.log('OAuth - User has plan:', userPlan.planId);
          // For now, we'll just log this. The frontend will handle the plan update
          // In a real implementation, you would update the user's subscription/plan
        }
      } catch (planError) {
        console.log('OAuth - Could not get user plan:', planError);
        // Continue with OAuth flow even if plan update fails
      }

      // Generate JWT
      const jwt = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
      console.log('Generated JWT for user:', user.email, 'JWT length:', jwt.length, 'User ID in JWT:', user.id);

      // Set JWT as HttpOnly, Secure cookie
      const isProduction = process.env.NODE_ENV === 'production';
      console.log('Setting JWT cookie, production:', isProduction);
      console.log('User email:', user.email, 'User ID:', user.id);
      res.cookie('jwt', jwt, {
        httpOnly: true,
        secure: isProduction, // true in production, false in development
        sameSite: 'none', // Allow cross-site cookies
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
        // No domain restriction to allow cross-domain cookies
      });
      console.log('JWT cookie set successfully');

      // Optionally, you can also send user info as a query param or just redirect
      console.log('Redirecting to dashboard...');
      return res.redirect('https://www.workflowguard.pro/dashboard');
    } catch (error) {
      console.log('OAuth callback error:', error.response?.data || error.message);
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

  @Public()
  @Get('debug')
  async debug(@Req() req: Request) {
    return {
      cookies: req.cookies,
      headers: {
        authorization: req.headers.authorization,
        cookie: req.headers.cookie,
      },
      userAgent: req.headers['user-agent'],
    };
  }

  @Public()
  @Get('test')
  async test() {
    return { message: 'Auth test endpoint working', timestamp: new Date().toISOString() };
  }

  @Public()
  @Get('set-test-cookie')
  async setTestCookie(@Res() res: Response) {
    // Create or find a real user in the database
    const user = await this.authService.findOrCreateUser('test@example.com', 'Test User');
    
    const jwt = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
    console.log('Setting test JWT cookie for real user:', user.email, 'User ID:', user.id);
    
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('jwt', jwt, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
    
    return res.json({ 
      message: 'Test JWT cookie set', 
      user: user,
      cookieSet: true 
    });
  }

  @Public()
  @Get('manual-auth')
  async manualAuth(@Res() res: Response) {
    // Create or find a test user
    const user = await this.authService.findOrCreateUser('test@workflowguard.pro', 'Test User');
    
    // Generate JWT
    const jwt = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
    console.log('Manual auth - Generated JWT for user:', user.email, 'User ID:', user.id);
    
    // Set JWT as HttpOnly, Secure cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('jwt', jwt, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'none', // Allow cross-site cookies
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
      // No domain restriction to allow cross-domain cookies
    });
    
    console.log('Manual auth - JWT cookie set successfully');
    
    // Redirect to dashboard
    return res.redirect('https://www.workflowguard.pro/dashboard');
  }

  @Public()
  @Get('manual-auth-with-hubspot')
  async manualAuthWithHubSpot(@Res() res: Response) {
    // Create or find a test user with HubSpot connection
    const user = await this.authService.findOrCreateUser('test-hubspot@workflowguard.pro', 'Test HubSpot User');
    
    // Update user with HubSpot connection
    await this.authService.updateUserHubspotPortalId(user.id, '243202415');
    await this.authService.updateUserHubspotTokens(user.id, 'test-access-token', 'test-refresh-token', 3600);
    
    // Generate JWT
    const jwt = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
    console.log('Manual auth with HubSpot - Generated JWT for user:', user.email, 'User ID:', user.id);
    
    // Set JWT as HttpOnly, Secure cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('jwt', jwt, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'none', // Allow cross-site cookies
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
      // No domain restriction to allow cross-domain cookies
    });
    
    console.log('Manual auth with HubSpot - JWT cookie set successfully');
    
    // Redirect to dashboard
    return res.redirect('https://www.workflowguard.pro/dashboard');
  }
}
