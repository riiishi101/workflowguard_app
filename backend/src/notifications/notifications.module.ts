import { Module } from '@nestjs/common';
import { UserSignupService } from './user-signup.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  providers: [UserSignupService],
  exports: [UserSignupService],
})
export class NotificationsModule {}
