import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { randomUUID } from 'crypto';
import { PLAN_CONFIG, PlanId } from '../plan-config';
import { ApiKey, NotificationSettings, Plan } from '../types/user.types';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
      data: createUserDto,
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      include: {
        subscription: true,
        workflows: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        subscription: true,
        workflows: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        subscription: true,
        workflows: true,
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async findOneWithSubscription(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        subscription: true,
      },
    });
  }

  async getPlanById(planId: string): Promise<Plan | null> {
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      const fallback = PLAN_CONFIG[planId as PlanId];
      if (fallback) {
        return {
          id: planId,
          name: planId,
          price: 0,
          interval: 'month',
          features: [...fallback.features],
        };
      }
      return null;
    }

    let featuresNormalized: string[] = [];
    const rawFeatures = plan.features as unknown;

    if (typeof rawFeatures === 'string' && rawFeatures.length > 0) {
      try {
        const parsed = JSON.parse(rawFeatures);
        if (Array.isArray(parsed)) {
          featuresNormalized = parsed.map((f) => String(f));
        } else {
          featuresNormalized = rawFeatures.split(',');
        }
      } catch {
        featuresNormalized = rawFeatures.split(',');
      }
    }

    featuresNormalized = featuresNormalized
      .map((f) => f.toLowerCase().trim())
      .filter((f) => f.length > 0);

    if (featuresNormalized.some((f) => f.includes('audit trail'))) {
      featuresNormalized.push('audit_logs');
    }

    if (featuresNormalized.some((f) => f.includes('api access'))) {
      featuresNormalized.push('api_access');
    }

    const uniqueFeatures = Array.from(new Set(featuresNormalized));

    return {
      ...plan,
      features: uniqueFeatures,
    };
  }

  async getOverageStats(userId: string) {
    const overages = await this.prisma.overage.findMany({
      where: { userId },
      include: {
        user: true,
      },
    });

    return {
      totalOverage: overages.reduce((sum, o) => sum + o.amount, 0),
      unbilledOverage: overages
        .filter((overage) => !overage.isBilled)
        .reduce((sum, o) => sum + o.amount, 0),
      overageCount: overages.length,
      unbilledCount: overages.filter((o) => !o.isBilled).length,
    };
  }

  async createOverage(userId: string, amount: number, description?: string) {
    return this.prisma.overage.create({
      data: {
        userId,
        planId: 'starter', // Default plan
        amount,
        description,
      },
    });
  }

  async getApiKeys(userId: string): Promise<Partial<ApiKey>[]> {
    const apiKeys = await this.prisma.apiKey.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        lastUsed: true,
        isActive: true,
      },
    });

    return apiKeys.map((key) => ({
      ...key,
      key: `${key.id.substring(0, 8)}...${key.id.substring(key.id.length - 4)}`,
    }));
  }

  async createApiKey(userId: string, apiKeyData: CreateApiKeyDto): Promise<ApiKey & { message: string }> {
    const { name, description } = apiKeyData;
    const apiKeyValue = `wg_${randomUUID().replace(/-/g, '')}`;

    const apiKey = await this.prisma.apiKey.create({
      data: {
        userId,
        name,
        description: description || '',
        key: apiKeyValue,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        key: true,
        createdAt: true,
        lastUsed: true,
        isActive: true,
      },
    });

    return {
      ...apiKey,
      message: "Store this API key securely. You won't be able to see it again.",
    };
  }

  async revokeApiKey(userId: string, keyId: string) {
    return this.prisma.apiKey.updateMany({
      where: { userId, id: keyId },
      data: { isActive: false },
    });
  }

  async revokeAllApiKeys(userId: string) {
    return this.prisma.apiKey.updateMany({
      where: { userId },
      data: { isActive: false },
    });
  }

  async createTrialSubscription(userId: string) {
    return this.prisma.subscription.create({
      data: {
        userId,
        planId: 'professional',
        status: 'trial',
        trialEndDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      },
    });
  }

  async checkTrialAccess(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'trial',
        planId: 'professional',
      },
    });

    if (!subscription) {
      return { hasTrial: false, message: 'No trial subscription found' };
    }

    const now = new Date();
    const isExpired = subscription.trialEndDate && subscription.trialEndDate < now;

    return {
      hasTrial: !isExpired,
      isExpired,
      endDate: subscription.trialEndDate,
      daysRemaining: subscription.trialEndDate
        ? Math.max(
            0,
            Math.ceil(
              (subscription.trialEndDate.getTime() - now.getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          )
        : 0,
    };
  }

  async upgradeSubscription(userId: string, planId: string) {
    await this.prisma.subscription.updateMany({
      where: {
        userId,
        planId: 'professional',
        status: 'trial',
      },
      data: { status: 'cancelled' },
    });

    return this.prisma.subscription.create({
      data: {
        userId,
        planId,
        status: 'active',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  async getUserPlan(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
      },
    });

    return subscription || { plan: null, status: 'no_subscription' };
  }

  async getUserOverages(userId: string, startDate?: Date, endDate?: Date) {
    const whereClause: { userId: string; createdAt?: { gte: Date; lte: Date } } = { userId };

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const overages = await this.prisma.overage.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return {
      overages,
      totalAmount: overages.reduce((sum, o) => sum + o.amount, 0),
      count: overages.length,
    };
  }

  async cancelMySubscription(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
      },
    });

    if (!subscription) {
      throw new HttpException('No active subscription found', HttpStatus.NOT_FOUND);
    }

    return this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'cancelled' },
    });
  }

  async getWorkflowCountByOwner(userId: string): Promise<number> {
    return this.prisma.workflow.count({
      where: { ownerId: userId },
    });
  }

  async getNotificationSettings(userId: string): Promise<NotificationSettings> {
    const settings = await this.prisma.notificationSettings.findUnique({
      where: { userId },
    });

    if (settings) {
      return settings;
    }

    return {
      userId,
      enabled: true,
      email: '',
      workflowDeleted: true,
      enrollmentTriggerModified: true,
      workflowRolledBack: true,
      criticalActionModified: true,
    };
  }

  async updateNotificationSettings(
    userId: string,
    dto: UpdateNotificationSettingsDto,
  ): Promise<NotificationSettings> {
    const defaultSettings = {
      enabled: true,
      email: '',
      workflowDeleted: true,
      enrollmentTriggerModified: true,
      workflowRolledBack: true,
      criticalActionModified: true,
    };

    return this.prisma.notificationSettings.upsert({
      where: { userId },
      update: dto,
      create: {
        userId,
        ...defaultSettings,
        ...dto,
      },
    });
  }

  async deleteApiKey(userId: string, keyId: string): Promise<{ success: boolean }> {
    const result = await this.prisma.apiKey.updateMany({
      where: {
        userId,
        id: keyId,
        isActive: true,
      },
      data: { isActive: false },
    });

    if (result.count === 0) {
      throw new HttpException('API key not found or already inactive', HttpStatus.NOT_FOUND);
    }

    return { success: true };
  }

  async getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
        workflows: true,
      },
    });
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
  }

  async deleteMe(userId: string) {
    return this.prisma.user.delete({
      where: { id: userId },
    });
  }

  async getMySubscription(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
      },
    });

    return subscription || { plan: null, status: 'no_subscription' };
  }

  async disconnectHubSpot(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        hubspotAccessToken: null,
        hubspotRefreshToken: null,
        hubspotPortalId: null,
        hubspotTokenExpiresAt: null,
      },
    });
  }
}
