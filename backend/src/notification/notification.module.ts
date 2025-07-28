import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [PrismaModule, EmailModule, RealtimeModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
