import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { SsoConfigController } from './sso-config.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'supersecretkey',
      signOptions: { expiresIn: '7d' },
    }),
    AuditLogModule,
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController, SsoConfigController],
  exports: [JwtModule, AuthService],
})
export class AuthModule {}
