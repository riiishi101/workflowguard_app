import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => {
          console.log('JWT Strategy - Invoked for request:', req?.method, req?.originalUrl || req?.url);
          console.log('JWT Strategy - Cookies present:', req?.cookies);
          const jwt = req?.cookies?.jwt;
          console.log('JWT Strategy - Extracted JWT from cookie:', jwt);
          return jwt;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'supersecretkey',
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    console.log('JWT Strategy - Validating payload:', payload);
    const user = await this.authService.validateJwtPayload(payload);
    if (!user) {
      console.log('JWT Strategy - Validation failed: No user found for payload:', payload);
      return null;
    }
    console.log('JWT Strategy - User found:', user.email);
    return user;
  }
} 