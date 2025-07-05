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
          console.log('JWT Strategy - Checking cookies:', req?.cookies);
          console.log('JWT Strategy - JWT from cookie:', req?.cookies?.jwt);
          return req?.cookies?.jwt;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'supersecretkey',
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    console.log('JWT Strategy - Validating payload:', payload);
    const user = await this.authService.validateJwtPayload(payload);
    console.log('JWT Strategy - User found:', user ? user.email : 'null');
    if (!user) {
      return null;
    }
    return user;
  }
} 