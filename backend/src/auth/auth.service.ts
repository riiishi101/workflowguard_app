import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from '../user/dto/create-user.dto';
import axios from 'axios';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async validateUser(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async createUser(email: string, name?: string, role: string = 'viewer', password?: string) {
    let data: any = { email, name, role };
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }
    return this.prisma.user.create({
      data,
    });
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(user as any).password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isMatch = await bcrypt.compare(password, (user as any).password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // Remove password from user object before returning
    const { password: _, ...userWithoutPassword } = user as any;
    return {
      access_token: this.jwtService.sign({ sub: user.id, email: user.email, role: user.role }),
      user: userWithoutPassword,
    };
  }

  async findOrCreateUser(email: string, name?: string) {
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name,
          role: 'viewer',
        },
      });
    }

    return user;
  }

  async validateJwtPayload(payload: { sub: string; email: string; role: string }) {
    return this.prisma.user.findUnique({ where: { id: payload.sub } });
  }

  async updateUserHubspotPortalId(userId: string, hubspotPortalId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { hubspotPortalId },
    });
  }

  async updateUserHubspotTokens(userId: string, accessToken: string, refreshToken: string, expiresIn: number) {
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        hubspotAccessToken: accessToken,
        hubspotRefreshToken: refreshToken,
        hubspotTokenExpiresAt: expiresAt,
      },
    });
  }

  async getValidHubspotAccessToken(user: any) {
    const now = new Date();
    if (user.hubspotAccessToken && user.hubspotTokenExpiresAt && user.hubspotTokenExpiresAt > now) {
      // Token is still valid
      return user.hubspotAccessToken;
    }
    // Token expired, refresh it
    if (!user.hubspotRefreshToken) {
      throw new Error('No HubSpot refresh token available');
    }
    const tokenRes = await axios.post('https://api.hubapi.com/oauth/v1/token', null, {
      params: {
        grant_type: 'refresh_token',
        client_id: process.env.HUBSPOT_CLIENT_ID,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET,
        refresh_token: user.hubspotRefreshToken,
      },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const { access_token, refresh_token, expires_in } = tokenRes.data;
    await this.updateUserHubspotTokens(user.id, access_token, refresh_token, expires_in);
    return access_token;
  }
}
