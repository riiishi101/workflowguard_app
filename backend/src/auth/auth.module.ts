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
      secret: (() => {
        if (!process.env.JWT_SECRET) {
          throw new Error('JWT_SECRET must be set in environment variables');
        }
        return process.env.JWT_SECRET;
      })(),
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
