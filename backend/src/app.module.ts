import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { WorkflowModule } from './workflow/workflow.module';
import { WorkflowVersionModule } from './workflow-version/workflow-version.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { SupportModule } from './support/support.module';
import { EmailModule } from './email/email.module';
import { MetricsModule } from './metrics/metrics.module';
import { WebhookModule } from './webhook/webhook.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { AppCacheModule } from './cache/cache.module';
import { HubSpotMarketplaceController } from './controllers/hubspot-marketplace.controller';
import { HubSpotMarketplaceBillingService } from './services/hubspot-marketplace-billing.service';
import { HubSpotBillingController } from './controllers/hubspot-billing.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    WorkflowModule,
    WorkflowVersionModule,
    AuditLogModule,
    EmailModule,
    WebhookModule,
    SupportModule,
    MetricsModule,
    SubscriptionModule,
    DashboardModule,
    AnalyticsModule,
    NotificationsModule,
    AdminModule,
    AppCacheModule,
  ],
  controllers: [AppController, HubSpotMarketplaceController, HubSpotBillingController],
  providers: [AppService, HubSpotMarketplaceBillingService],
})
export class AppModule {}
