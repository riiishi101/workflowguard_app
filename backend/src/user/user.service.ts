import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NotificationService } from '../notification/notification.service';
import { PLAN_CONFIG } from '../plan-config';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
    private notificationService: NotificationService,
  ) {}

  async create(data: CreateUserDto): Promise<User> {
    return this.prisma.user.create({
      data: {
        ...data,
        role: data.role ?? 'viewer',
      },
    });
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async findOne(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async getWorkflowCountByOwner(ownerId: string): Promise<number> {
    return this.prisma.workflow.count({ where: { ownerId } });
  }

  async findOneWithSubscription(id: string): Promise<(User & { subscription: any; hubspotPortalId: string | null }) | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { subscription: true },
    });
  }

  async getPlanById(planId: string) {
    return (this.prisma as any).plan.findUnique({ where: { id: planId } });
  }

  async updateUserPlan(userId: string, newPlanId: string, actorUserId: string) {
    // Find the user's current subscription
    const subscription = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!subscription) throw new Error('Subscription not found');
    const oldValue = { ...subscription };
    // Update the planId
    const updated = await this.prisma.subscription.update({
      where: { userId },
      data: { planId: newPlanId },
    });
    // Log the change
    await this.auditLogService.create({
      userId: actorUserId,
      action: 'plan_change',
      entityType: 'subscription',
      entityId: updated.id,
      oldValue,
      newValue: updated,
    });
    return updated;
  }

  async getUserOverages(userId: string, periodStart?: Date, periodEnd?: Date) {
    const where: any = { userId };
    if (periodStart && periodEnd) {
      where.periodStart = { gte: periodStart };
      where.periodEnd = { lte: periodEnd };
    }
    return this.prisma.overage.findMany({
      where,
      orderBy: { periodStart: 'desc' },
    });
  }

  async getOverageStats(userId: string) {
    const overages = await this.prisma.overage.findMany({
      where: { userId },
      orderBy: { periodStart: 'desc' },
    });
    
    const totalOverages = overages.reduce((sum, overage) => sum + overage.amount, 0);
    const unbilledOverages = overages
      .filter(overage => !overage.billed)
      .reduce((sum, overage) => sum + overage.amount, 0);
    
    return {
      totalOverages,
      unbilledOverages,
      overagePeriods: overages.length,
      currentPeriodOverages: overages.find(o => {
        const now = new Date();
        return o.periodStart <= now && o.periodEnd >= now;
      })?.amount || 0,
    };
  }

  async getUserPlan(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    return subscription;
  }

  async trackOverage(userId: string, type: string, amount: number, periodStart: Date, periodEnd: Date) {
    const overage = await this.prisma.overage.create({
      data: {
        userId,
        type,
        amount,
        periodStart,
        periodEnd,
      },
    });

    // Send notification for the overage
    await this.notificationService.sendOverageAlert(userId, {
      overageId: overage.id,
      type,
      amount,
      periodStart,
      periodEnd,
    });

    return overage;
  }

  async getNotificationSettings(userId: string) {
    return this.prisma.notificationSettings.findUnique({ where: { userId } });
  }

  async updateNotificationSettings(userId: string, dto: any) {
    return this.prisma.notificationSettings.upsert({
      where: { userId },
      update: dto,
      create: { userId, ...dto },
    });
  }

  async getApiKeys(userId: string) {
    return this.prisma.apiKey.findMany({
      where: { userId, revoked: false },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        description: true,
        createdAt: true,
        lastUsed: true,
        revoked: true,
      },
    });
  }

  async createApiKey(userId: string, description: string) {
    // Generate a random API key
    const rawKey = randomBytes(32).toString('hex');
    // Hash the key (SHA256)
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    // Store the hash
    const apiKey = await this.prisma.apiKey.create({
      data: {
        userId,
        description,
        keyHash,
      },
    });
    // Return the raw key only once
    return { id: apiKey.id, description: apiKey.description, createdAt: apiKey.createdAt, key: rawKey };
  }

  async deleteApiKey(userId: string, id: string) {
    // Mark as revoked
    return this.prisma.apiKey.updateMany({
      where: { id, userId },
      data: { revoked: true },
    });
  }

  async getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        jobTitle: true,
        timezone: true,
        language: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateMe(userId: string, dto: any) {
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

  async findAllWithHubSpotTokens() {
    return this.prisma.user.findMany({
      where: {
        hubspotAccessToken: { not: null },
        hubspotTokenExpiresAt: { gt: new Date() },
      },
    });
  }
}
