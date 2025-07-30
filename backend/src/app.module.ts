import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { WorkflowModule } from './workflow/workflow.module';
import { WorkflowVersionModule } from './workflow-version/workflow-version.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { WebhookModule } from './webhook/webhook.module';
import { OverageModule } from './overage/overage.module';
import { HubSpotBillingModule } from './modules/hubspot-billing.module';
import { HubSpotModule } from './modules/hubspot.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { EmailModule } from './email/email.module';
import { RealtimeModule } from './realtime/realtime.module';
import { MetricsModule } from './metrics/metrics.module';
import { SupportModule } from './support/support.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    WorkflowModule,
    WorkflowVersionModule,
    AuditLogModule,
    UserModule,
    WebhookModule,
    OverageModule,
    HubSpotBillingModule,
    HubSpotModule,
    AnalyticsModule,
    EmailModule,
    RealtimeModule,
    MetricsModule,
    SupportModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
