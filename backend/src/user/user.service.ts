import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NotificationService } from '../notification/notification.service';
import { PLAN_CONFIG, PlanId } from '../plan-config';
import { randomBytes, createHash } from 'crypto';
import { EmailService } from '../services/email.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  private userCache = new Map<string, { data: any, expires: number }>();

  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
    private notificationService: NotificationService,
    private emailService: EmailService,
  ) {}

  async create(data: CreateUserDto, actorUserId?: string): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        ...data,
        role: data.role ?? 'viewer',
      },
    });
    await this.auditLogService.create({
      userId: actorUserId,
      action: 'create',
      entityType: 'user',
      entityId: user.id,
      newValue: user,
    });
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async findOne(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
        jobTitle: true,
        timezone: true,
        language: true,
        createdAt: true,
        updatedAt: true,
        firstInstalledAt: true,
        lastActiveAt: true,
        hubspotPortalId: true,
        hubspotAccessToken: true,
        hubspotRefreshToken: true,
        hubspotTokenExpiresAt: true,
        resetToken: true,
        resetTokenExpires: true,
        planId: true,
        trialStartDate: true,
        trialEndDate: true,
        isTrialActive: true,
        trialPlanId: true,
      },
    });

    // If user exists but plan fields are null or incomplete, set defaults
    if (
      user &&
      (user.isTrialActive === null ||
        user.trialEndDate === null ||
        user.trialPlanId === null)
    ) {
      const now = new Date();
      const trialDays = 21;
      const trialEnd = new Date(
        now.getTime() + trialDays * 24 * 60 * 60 * 1000,
      );

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: {
          planId: user.planId || 'trial',
          trialStartDate: user.trialStartDate || now,
          trialEndDate: user.trialEndDate || trialEnd,
          isTrialActive:
            user.isTrialActive !== null ? user.isTrialActive : true,
          trialPlanId: user.trialPlanId || 'professional',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          password: true,
          jobTitle: true,
          timezone: true,
          language: true,
          createdAt: true,
          updatedAt: true,
          firstInstalledAt: true,
          lastActiveAt: true,
          hubspotPortalId: true,
          hubspotAccessToken: true,
          hubspotRefreshToken: true,
          hubspotTokenExpiresAt: true,
          resetToken: true,
          resetTokenExpires: true,
          planId: true,
          trialStartDate: true,
          trialEndDate: true,
          isTrialActive: true,
          trialPlanId: true,
        },
      });
      return updatedUser;
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(
    id: string,
    data: Prisma.UserUpdateInput & { updatedBy?: string },
  ): Promise<User> {
    const oldUser = await this.prisma.user.findUnique({ where: { id } });
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });
    await this.auditLogService.create({
      userId: (data as any).updatedBy,
      action: 'update',
      entityType: 'user',
      entityId: user.id,
      oldValue: oldUser,
      newValue: user,
    });
    return user;
  }

  async remove(id: string, actorUserId?: string): Promise<User> {
    const oldUser = await this.prisma.user.findUnique({ where: { id } });
    const user = await this.prisma.user.delete({ where: { id } });
    await this.auditLogService.create({
      userId: actorUserId,
      action: 'delete',
      entityType: 'user',
      entityId: id,
      oldValue: oldUser,
    });
    return user;
  }

  async getWorkflowCountByOwner(ownerId: string): Promise<number> {
    return this.prisma.workflow.count({ where: { ownerId } });
  }

  async findOneWithSubscription(
    id: string,
  ): Promise<
    (User & { subscription: any; hubspotPortalId: string | null }) | null
  > {
    return this.prisma.user.findUnique({
      where: { id },
      include: { subscription: true },
    });
  }

  async getPlanById(planId: string) {
    return PLAN_CONFIG[planId as PlanId] || PLAN_CONFIG.trial;
  }

  async updateUserPlan(userId: string, newPlanId: string) {
    // Update the planId field on the user
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { planId: newPlanId },
    });
    // Optionally, log the change
    await this.auditLogService.create({
      userId,
      action: 'plan_change',
      entityType: 'user',
      entityId: userId,
      oldValue: undefined, // You can fetch and pass the old value if needed
      newValue: user,
    });
    return user;
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

    const totalOverages = overages.reduce(
      (sum, overage) => sum + overage.amount,
      0,
    );
    const unbilledOverages = overages
      .filter((overage) => !overage.billed)
      .reduce((sum, overage) => sum + overage.amount, 0);

    return {
      totalOverages,
      unbilledOverages,
      overagePeriods: overages.length,
      currentPeriodOverages:
        overages.find((o) => {
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

  async trackOverage(
    userId: string,
    type: string,
    amount: number,
    periodStart: Date,
    periodEnd: Date,
  ) {
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
    const oldSettings = await this.prisma.notificationSettings.findUnique({
      where: { userId },
    });
    const settings = await this.prisma.notificationSettings.upsert({
      where: { userId },
      update: dto,
      create: { userId, ...dto },
    });
    await this.auditLogService.create({
      userId,
      action: 'update',
      entityType: 'notification_settings',
      entityId: userId,
      oldValue: oldSettings,
      newValue: settings,
    });
    return settings;
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
    return {
      id: apiKey.id,
      description: apiKey.description,
      createdAt: apiKey.createdAt,
      key: rawKey,
    };
  }

  async deleteApiKey(userId: string, id: string) {
    // Mark as revoked
    return this.prisma.apiKey.updateMany({
      where: { id, userId },
      data: { revoked: true },
    });
  }

  async getMe(userId: string) {
    const now = Date.now();
    const cached = this.userCache.get(userId);
    if (cached && cached.expires > now) {
      return cached.data;
    }
    const data = await this.prisma.user.findUnique({
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
    this.userCache.set(userId, { data, expires: now + 30 * 1000 }); // cache for 30 seconds
    return data;
  }

  async updateMe(userId: string, dto: any): Promise<User> {
    const oldUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
    await this.auditLogService.create({
      userId,
      action: 'update',
      entityType: 'user',
      entityId: userId,
      oldValue: oldUser,
      newValue: user,
    });
    return user;
  }

  async deleteMe(userId: string): Promise<User> {
    const oldUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    const user = await this.prisma.user.delete({ where: { id: userId } });
    await this.auditLogService.create({
      userId,
      action: 'delete',
      entityType: 'user',
      entityId: userId,
      oldValue: oldUser,
    });
    return user;
  }

  async findAllWithHubSpotTokens() {
    return this.prisma.user.findMany({
      where: {
        hubspotAccessToken: { not: null },
        hubspotTokenExpiresAt: { gt: new Date() },
      },
    });
  }

  async resetPassword(userId: string) {
    // Generate a reset token
    const token = randomBytes(32).toString('hex');
    // Store the token and expiry (e.g., 1 hour) in the user record or a separate table
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        resetToken: token,
        resetTokenExpires: new Date(Date.now() + 60 * 60 * 1000),
      } as any, // Add these fields to your schema if not present
    });
    // Send email with reset link
    await this.emailService.sendPasswordResetEmail({
      userEmail: user.email,
      userName: user.name || user.email,
      resetToken: token,
    });
    // Log the token for debugging (should be removed in production)
    console.log(`Password reset token for user ${userId}: ${token}`);
    return token;
  }

  async resetPasswordWithToken(
    token: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    // Find user by token and check expiry
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: { gt: new Date() },
      },
    });
    if (!user) {
      return { success: false, message: 'Invalid or expired token.' };
    }
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // Update user password and clear resetToken fields
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      } as any,
    });
    return { success: true, message: 'Password reset successful.' };
  }

  async countActiveInstalls(since: Date): Promise<number> {
    return this.prisma.user.count({
      where: {
        hubspotPortalId: { not: null },
        lastActiveAt: { gte: since },
      },
    });
  }

  async findByHubspotPortalId(portalId: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { hubspotPortalId: portalId } });
  }

  async exportUserData(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const workflows = await this.prisma.workflow.findMany({
      where: { ownerId: userId },
    });
    const workflowIds = workflows.map((w) => w.id);
    const workflowVersions = await this.prisma.workflowVersion.findMany({
      where: { workflowId: { in: workflowIds } },
    });
    const auditLogs = await this.prisma.auditLog.findMany({
      where: { userId },
    });
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    const webhooks = await this.prisma.webhook.findMany({ where: { userId } });
    const overages = await this.prisma.overage.findMany({ where: { userId } });
    const notificationSettings =
      await this.prisma.notificationSettings.findUnique({ where: { userId } });
    const apiKeys = await this.prisma.apiKey.findMany({ where: { userId } });
    return {
      user,
      workflows,
      workflowVersions,
      auditLogs,
      subscription,
      webhooks,
      overages,
      notificationSettings,
      apiKeys,
    };
  }

  async disconnectHubspot(userId: string) {
    const oldUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        hubspotAccessToken: null,
        hubspotRefreshToken: null,
        hubspotTokenExpiresAt: null,
        hubspotPortalId: null,
      },
    });
    await this.auditLogService.create({
      userId,
      action: 'disconnect',
      entityType: 'hubspot',
      entityId: userId,
      oldValue: oldUser,
      newValue: user,
    });
    return user;
  }
}
