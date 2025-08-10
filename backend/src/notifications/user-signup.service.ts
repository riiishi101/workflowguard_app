import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserSignupService {
  constructor(private prisma: PrismaService) {}

  async notifyNewUserSignup(user: any, signupSource: 'oauth' | 'marketplace' | 'direct') {
    try {
      // Log detailed signup information
      console.log('🎉 NEW USER SIGNUP DETECTED!');
      console.log('================================');
      console.log(`📧 Email: ${user.email}`);
      console.log(`👤 Name: ${user.name}`);
      console.log(`🆔 User ID: ${user.id}`);
      console.log(`🏢 HubSpot Portal: ${user.hubspotPortalId}`);
      console.log(`📅 Signup Date: ${new Date().toISOString()}`);
      console.log(`🔗 Source: ${signupSource.toUpperCase()}`);
      console.log('================================');

      // Create audit log entry for signup tracking
      await this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_SIGNUP',
          entityType: 'USER',
          entityId: user.id,
          newValue: {
            email: user.email,
            name: user.name,
            hubspotPortalId: user.hubspotPortalId,
            signupSource,
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date(),
        },
      });

      // Send email notification to admin (you can configure this)
      await this.sendAdminNotification(user, signupSource);

      // Optional: Send welcome email to user
      await this.sendWelcomeEmail(user);

    } catch (error) {
      console.error('Failed to process user signup notification:', error);
    }
  }

  private async sendAdminNotification(user: any, signupSource: string) {
    // TODO: Implement email/Slack/Discord notification to admin
    console.log('📬 ADMIN NOTIFICATION: New user signup requires attention');
    console.log(`User: ${user.email} (${user.name})`);
    console.log(`Source: ${signupSource}`);
    console.log(`Portal ID: ${user.hubspotPortalId}`);
  }

  private async sendWelcomeEmail(user: any) {
    // TODO: Implement welcome email to new user
    console.log('📧 WELCOME EMAIL: Queued for', user.email);
  }

  async getUserSignupStats(days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const signups = await this.prisma.auditLog.findMany({
      where: {
        action: 'USER_SIGNUP',
        timestamp: { gte: startDate },
      },
      orderBy: { timestamp: 'desc' },
    });

    const signupsByDay: Record<string, number> = signups.reduce((acc, signup) => {
      const date = signup.timestamp.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalSignups: signups.length,
      signupsByDay,
      recentSignups: signups.slice(0, 10).map(s => ({
        userId: s.userId,
        timestamp: s.timestamp,
        details: s.newValue,
      })),
    };
  }
}
