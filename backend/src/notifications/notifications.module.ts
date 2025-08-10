import { Module } from '@nestjs/common';
import { UserSignupService } from './user-signup.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [UserSignupService],
  exports: [UserSignupService],
})
export class NotificationsModule {}
