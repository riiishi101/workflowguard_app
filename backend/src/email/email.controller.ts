import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { EmailService } from '../services/email.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
  };
}

interface SendOverageAlertDto {
  userEmail: string;
  userName: string;
  overageCount: number;
  overageAmount: number;
  period: string;
  planId: string;
  recommendedPlan?: string;
}

interface SendBillingUpdateDto {
  userEmail: string;
  userName: string;
  billingAmount: number;
  billingPeriod: string;
  overageDetails: Array<{
    period: string;
    count: number;
    amount: number;
  }>;
}

interface SendSystemAlertDto {
  userEmail: string;
  userName: string;
  alertType: 'plan_upgrade' | 'plan_downgrade' | 'usage_warning' | 'system_maintenance';
  message: string;
  actionRequired?: boolean;
}

interface SendWelcomeEmailDto {
  userEmail: string;
  userName: string;
  planId: string;
  workflowLimit: number;
  features: string[];
}

interface SendUpgradeRecommendationDto {
  userEmail: string;
  userName: string;
  currentPlan: string;
  recommendedPlan: string;
  reason: string;
}

interface SendUsageWarningDto {
  userEmail: string;
  userName: string;
  planId: string;
  currentUsage: number;
  limit: number;
  percentageUsed: number;
}

interface SendBulkNotificationDto {
  userEmails: string[];
  subject: string;
  message: string;
  isHtml?: boolean;
}

interface ContactFormDto {
  name: string;
  email: string;
  subject: string;
  message: string;
}

@Controller('email')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  /**
   * Send overage alert email
   * Admin only - for sending overage notifications
   */
  @Post('overage-alert')
  @Roles('admin')
  async sendOverageAlert(@Body() data: SendOverageAlertDto) {
    const success = await this.emailService.sendOverageAlert(data);
    return {
      success,
      message: success ? 'Overage alert sent successfully' : 'Failed to send overage alert',
    };
  }

  /**
   * Send billing update email
   * Admin only - for sending billing notifications
   */
  @Post('billing-update')
  @Roles('admin')
  async sendBillingUpdate(@Body() data: SendBillingUpdateDto) {
    const success = await this.emailService.sendBillingUpdate(data);
    return {
      success,
      message: success ? 'Billing update sent successfully' : 'Failed to send billing update',
    };
  }

  /**
   * Send system alert email
   * Admin only - for sending system notifications
   */
  @Post('system-alert')
  @Roles('admin')
  async sendSystemAlert(@Body() data: SendSystemAlertDto) {
    const success = await this.emailService.sendSystemAlert(data);
    return {
      success,
      message: success ? 'System alert sent successfully' : 'Failed to send system alert',
    };
  }

  /**
   * Send welcome email
   * Admin only - for sending welcome notifications
   */
  @Post('welcome')
  @Roles('admin')
  async sendWelcomeEmail(@Body() data: SendWelcomeEmailDto) {
    const success = await this.emailService.sendWelcomeEmail(data);
    return {
      success,
      message: success ? 'Welcome email sent successfully' : 'Failed to send welcome email',
    };
  }

  /**
   * Send upgrade recommendation email
   * Admin only - for sending upgrade recommendations
   */
  @Post('upgrade-recommendation')
  @Roles('admin')
  async sendUpgradeRecommendation(@Body() data: SendUpgradeRecommendationDto) {
    const success = await this.emailService.sendUpgradeRecommendation(
      data.userEmail,
      data.userName,
      data.currentPlan,
      data.recommendedPlan,
      data.reason
    );
    return {
      success,
      message: success ? 'Upgrade recommendation sent successfully' : 'Failed to send upgrade recommendation',
    };
  }

  /**
   * Send usage warning email
   * Admin only - for sending usage warnings
   */
  @Post('usage-warning')
  @Roles('admin')
  async sendUsageWarning(@Body() data: SendUsageWarningDto) {
    const success = await this.emailService.sendUsageWarning(
      data.userEmail,
      data.userName,
      data.planId,
      data.currentUsage,
      data.limit,
      data.percentageUsed
    );
    return {
      success,
      message: success ? 'Usage warning sent successfully' : 'Failed to send usage warning',
    };
  }

  /**
   * Send bulk notification to multiple users
   * Admin only - for sending bulk notifications
   */
  @Post('bulk-notification')
  @Roles('admin')
  async sendBulkNotification(@Body() data: SendBulkNotificationDto) {
    const result = await this.emailService.sendBulkNotification(
      data.userEmails,
      data.subject,
      data.message,
      data.isHtml ?? true
    );
    return {
      success: result.success,
      failed: result.failed,
      total: data.userEmails.length,
      message: `Bulk notification completed: ${result.success} successful, ${result.failed} failed`,
    };
  }

  /**
   * Public endpoint for contact form submissions
   */
  @Post('contact')
  async sendContactForm(@Body() data: ContactFormDto) {
    const { name, email, subject, message } = data;
    try {
      await this.emailService.sendEmail({
        to: 'contact@workflowguard.pro',
        subject: `[Contact Form] ${subject}`,
        html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong><br/>${message}</p>`,
        text: `Name: ${name}\nEmail: ${email}\nMessage:\n${message}`,
      });
      return { success: true, message: 'Message sent successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to send message', error: error.message };
    }
  }

  /**
   * Send test email to current user
   * Users can test email functionality
   */
  @Post('test')
  async sendTestEmail(@Request() req: RequestWithUser) {
    const testData = {
      userEmail: req.user.email,
      userName: req.user.name || req.user.email,
      alertType: 'system_maintenance' as const,
      message: 'This is a test email from WorkflowGuard to verify email functionality.',
      actionRequired: false,
    };

    const success = await this.emailService.sendSystemAlert(testData);
    return {
      success,
      message: success ? 'Test email sent successfully' : 'Failed to send test email',
    };
  }

  /**
   * Send welcome email to current user
   * Users can request welcome email
   */
  @Post('welcome-self')
  async sendWelcomeEmailToSelf(@Request() req: RequestWithUser, @Body() data: { planId: string; workflowLimit: number; features: string[] }) {
    const welcomeData = {
      userEmail: req.user.email,
      userName: req.user.name || req.user.email,
      planId: data.planId,
      workflowLimit: data.workflowLimit,
      features: data.features,
    };

    const success = await this.emailService.sendWelcomeEmail(welcomeData);
    return {
      success,
      message: success ? 'Welcome email sent successfully' : 'Failed to send welcome email',
    };
  }

  /**
   * Send usage warning to current user
   * Users can request usage warning email
   */
  @Post('usage-warning-self')
  async sendUsageWarningToSelf(
    @Request() req: RequestWithUser,
    @Body() data: { planId: string; currentUsage: number; limit: number; percentageUsed: number }
  ) {
    const warningData = {
      userEmail: req.user.email,
      userName: req.user.name || req.user.email,
      planId: data.planId,
      currentUsage: data.currentUsage,
      limit: data.limit,
      percentageUsed: data.percentageUsed,
    };

    const success = await this.emailService.sendUsageWarning(
      warningData.userEmail,
      warningData.userName,
      warningData.planId,
      warningData.currentUsage,
      warningData.limit,
      warningData.percentageUsed
    );
    return {
      success,
      message: success ? 'Usage warning sent successfully' : 'Failed to send usage warning',
    };
  }
} 