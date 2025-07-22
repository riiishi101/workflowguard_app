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
          const jwt = req?.cookies?.jwt;
          return jwt;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'supersecretkey',
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    console.log('[JWT STRATEGY] validate called with payload:', payload);
    const user = await this.authService.validateJwtPayload(payload);
    if (!user) {
      console.log('[JWT STRATEGY] No user found for payload:', payload);
      return null;
    }
    console.log('[JWT STRATEGY] User validated:', user.id || user.email || user);
    return user;
  }
}
