import { Module } from '@nestjs/common';
import { ActionsController } from './actions.controller';
import { ActionsService } from './actions.service';
import { PrismaModule } from '../prisma/prisma.module';
import { HubSpotService } from '../services/hubspot.service';

@Module({
  imports: [PrismaModule],
  controllers: [ActionsController],
  providers: [ActionsService, HubSpotService],
})
export class ActionsModule {}
