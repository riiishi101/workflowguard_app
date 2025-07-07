import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NotificationService } from '../notification/notification.service';
import { PLAN_CONFIG } from '../plan-config';
import { randomBytes, createHash } from 'crypto';
import { EmailService } from '../services/email.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
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
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput & { updatedBy?: string }): Promise<User> {
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
    const oldSettings = await this.prisma.notificationSettings.findUnique({ where: { userId } });
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

  async updateMe(userId: string, dto: any): Promise<User> {
    const oldUser = await this.prisma.user.findUnique({ where: { id: userId } });
    const user = await this.prisma.user.update({ where: { id: userId }, data: dto });
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
    const oldUser = await this.prisma.user.findUnique({ where: { id: userId } });
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

  async resetPasswordWithToken(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
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
}
