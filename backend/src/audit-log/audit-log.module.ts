import { Module, forwardRef } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';
import { RealtimeService } from '../services/realtime.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [PrismaModule, forwardRef(() => UserModule), JwtModule],
  providers: [AuditLogService, RealtimeService],
  controllers: [AuditLogController],
  exports: [AuditLogService],
})
export class AuditLogModule {}
