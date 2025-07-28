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
          console.log('[JWT STRATEGY] Cookie extraction - Request URL:', req.url);
          console.log('[JWT STRATEGY] Cookie extraction - Request method:', req.method);
          console.log('[JWT STRATEGY] Cookie extraction - All cookies:', req.cookies);
          const jwt = req?.cookies?.jwt;
          console.log('[JWT STRATEGY] Cookie extraction - jwt present:', !!jwt);
          if (jwt) {
            console.log('[JWT STRATEGY] JWT token length:', jwt.length);
            console.log('[JWT STRATEGY] JWT token first 50 chars:', jwt.substring(0, 50));
          }
          return jwt;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'supersecretkey',
    });
    console.log('[JWT STRATEGY] Initialized with secret length:', (process.env.JWT_SECRET || 'supersecretkey').length);
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    console.log('[JWT STRATEGY] validate called with payload:', payload);
    console.log('[JWT STRATEGY] Payload sub (userId):', payload.sub);
    console.log('[JWT STRATEGY] Payload email:', payload.email);
    console.log('[JWT STRATEGY] Payload role:', payload.role);
    
    const user = await this.authService.validateJwtPayload(payload);
    if (!user) {
      console.log('[JWT STRATEGY] No user found for payload:', payload);
      return null;
    }
    console.log('[JWT STRATEGY] User validated:', user.id || user.email || user);
    return user;
  }
}
