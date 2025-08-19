import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { UserSignupService } from '../notifications/user-signup.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private jwtService: JwtService,
    private userSignupService: UserSignupService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (
      user &&
      user.password &&
      (await bcrypt.compare(password, user.password))
    ) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async register(createUserDto: any) {
    const { password, ...userData } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
    });

    // Automatically create trial subscription for new users
    await this.userService.createTrialSubscription(user.id);

    const { password: _, ...result } = user;
    return result;
  }

  async validateHubSpotUser(hubspotUser: any) {
    try {
      console.log('validateHubSpotUser called with:', {
        email: hubspotUser.email,
        portalId: hubspotUser.portalId,
        hasAccessToken: !!hubspotUser.accessToken
      });

      // For HubSpot App Marketplace users, create account if doesn't exist
      let user = await this.prisma.user.findUnique({
        where: { email: hubspotUser.email },
      });

      if (!user) {
        console.log('Creating new user from HubSpot OAuth');
        // Create new user from HubSpot
        user = await this.prisma.user.create({
          data: {
            email: hubspotUser.email,
            name: hubspotUser.name || hubspotUser.email,
            hubspotPortalId: hubspotUser.portalId,
            hubspotAccessToken: hubspotUser.accessToken,
            hubspotRefreshToken: hubspotUser.refreshToken,
            hubspotTokenExpiresAt: hubspotUser.tokenExpiresAt,
          },
        });

        console.log('User created successfully:', user.id);

        // Try to create trial subscription, but don't fail if it errors
        try {
          await this.userService.createTrialSubscription(user.id);
          console.log('Trial subscription created for user:', user.id);
        } catch (trialError) {
          console.error('Failed to create trial subscription:', trialError);
          // Continue without failing the OAuth flow
        }

        // Try to notify about signup, but don't fail if it errors
        try {
          await this.userSignupService.notifyNewUserSignup(user, 'oauth');
          console.log('Signup notification sent for user:', user.id);
        } catch (notifyError) {
          console.error('Failed to send signup notification:', notifyError);
          // Continue without failing the OAuth flow
        }
      } else {
        console.log('Updating existing user HubSpot tokens:', user.id);
        // Update existing user's HubSpot tokens
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            hubspotPortalId: hubspotUser.portalId,
            hubspotAccessToken: hubspotUser.accessToken,
            hubspotRefreshToken: hubspotUser.refreshToken,
            hubspotTokenExpiresAt: hubspotUser.tokenExpiresAt,
          },
        });
        console.log('User tokens updated successfully');
      }

      const { password: _, ...result } = user;
      return result;
    } catch (error) {
      console.error('validateHubSpotUser error:', error);
      throw error;
    }
  }

  async validateJwtPayload(payload: { sub: string; email: string }) {
    console.log(
      'AuthService - validateJwtPayload called with payload:',
      payload,
    );

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    console.log(
      'AuthService - User found in database:',
      user ? { id: user.id, email: user.email } : null,
    );

    return user;
  }

  async verifyToken(token: string) {
    try {
      console.log(
        'AuthService - Verifying token:',
        token.substring(0, 20) + '...',
      );

      const payload = this.jwtService.verify(token);
      console.log('AuthService - JWT payload verified:', {
        sub: payload.sub,
        email: payload.email,
      });

      const user = await this.validateJwtPayload(payload);
      console.log(
        'AuthService - User found from payload:',
        user ? { id: user.id, email: user.email } : null,
      );

      if (!user) {
        console.log('AuthService - No user found for payload');
        return null;
      }

      // Remove password from user object before returning
      const { password: _, ...userWithoutPassword } = user as any;
      console.log('AuthService - Returning user without password:', {
        id: userWithoutPassword.id,
        email: userWithoutPassword.email,
      });
      return userWithoutPassword;
    } catch (error) {
      console.error('AuthService - Token verification failed:', error.message);
      return null;
    }
  }

  generateToken(user: any) {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });
  }

  async updateUserHubspotPortalId(userId: string, hubspotPortalId: string) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { hubspotPortalId },
      });
    } catch {
      throw new HttpException(
        'Failed to update HubSpot portal ID',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateUserHubspotTokens(
    userId: string,
    tokens: { access_token: string; refresh_token: string; expires_in: number },
  ) {
    try {
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          hubspotAccessToken: tokens.access_token,
          hubspotRefreshToken: tokens.refresh_token,
          hubspotTokenExpiresAt: expiresAt,
        },
      });
    } catch {
      throw new HttpException(
        'Failed to update HubSpot tokens',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createTrialSubscription(userId: string) {
    try {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 21); // 21-day trial

      await this.prisma.subscription.upsert({
        where: { userId },
        update: {
          planId: 'professional',
          status: 'trial',
          trialEndDate,
          nextBillingDate: trialEndDate,
        },
        create: {
          userId,
          planId: 'professional',
          status: 'trial',
          trialEndDate,
          nextBillingDate: trialEndDate,
        },
      });
    } catch (error) {
      console.error('Failed to create trial subscription:', error);
      // Don't throw error to avoid breaking OAuth flow
    }
  }
}
