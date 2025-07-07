import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { SsoConfigController } from './sso-config.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'supersecretkey',
      signOptions: { expiresIn: '7d' },
    }),
    AuditLogModule,
    UserModule,
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController, SsoConfigController],
  exports: [JwtModule, AuthService],
})
export class AuthModule {}
