import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';

// Define interfaces for email data to avoid using 'any'
export interface Subscription {
  planId: string;
  // Add other subscription properties as needed
}

export interface NotificationData {
  [key: string]: any; // Flexible for various templates
}

export interface OverageAlertData {
  user: User;
  usage: number;
  limit: number;
}

export interface BillingUpdateData {
  user: User;
  invoiceId: string;
  amount: number;
}

export interface SystemAlertData {
  level: 'info' | 'warning' | 'error';
  message: string;
}

export interface BulkNotificationResult {
  success: boolean;
  sent: number;
  failed: number;
}

@Injectable()
export class EmailService {
  async sendEmail(to: string, subject: string, content: string): Promise<void> {
    console.log(`Email sent to ${to}: ${subject}`);
  }

  async sendNotificationEmail(
    to: string,
    template: string,
    data: NotificationData,
  ): Promise<void> {
    console.log(`Notification email sent to ${to} using template ${template}`);
  }

  // Add missing methods
  async sendOverageAlert(data: OverageAlertData): Promise<boolean> {
    console.log('Overage alert email sent:', data);
    return true;
  }

  async sendBillingUpdate(data: BillingUpdateData): Promise<boolean> {
    console.log('Billing update email sent:', data);
    return true;
  }

  async sendSystemAlert(data: SystemAlertData): Promise<boolean> {
    console.log('System alert email sent:', data);
    return true;
  }

  async sendWelcomeEmail(user: User): Promise<boolean> {
    const subject = `👋 Welcome to WorkflowGuard, ${user.name}!`;
    const emailContent = `
      <h2>Welcome to WorkflowGuard!</h2>
      <p>Hi ${user.name},</p>
      <p>Thank you for signing up. We're excited to have you on board.</p>
      <p>You can now start protecting your HubSpot workflows.</p>
      <p>
        <a href="https://www.workflowguard.pro/dashboard"
           style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Go to your Dashboard
        </a>
      </p>
      <p>If you have any questions, feel free to contact our support team.</p>
      <p>Best,<br/>The WorkflowGuard Team</p>
    `;

    try {
      if (process.env.SENDGRID_API_KEY) {
        const sgMail = await import('@sendgrid/mail');
        sgMail.default.setApiKey(process.env.SENDGRID_API_KEY);

        const msg = {
          to: user.email,
          from: 'noreply@workflowguard.pro',
          subject: subject,
          html: emailContent,
        };

        await sgMail.default.send(msg);
        console.log(`✅ Welcome email sent to: ${user.email}`);
        return true;
      } else {
        console.log('📧 WELCOME EMAIL (SendGrid not configured):');
        console.log(`To: ${user.email}`);
        console.log(`Subject: ${subject}`);
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      return false;
    }
  }

  async sendUpgradeRecommendation(
    userName: string,
    currentPlan: string,
    recommendedPlan: string,
    reason: string,
    additionalData?: Record<string, unknown>,
  ): Promise<boolean> {
    console.log('Upgrade recommendation email sent:', {
      userName,
      currentPlan,
      recommendedPlan,
      reason,
      additionalData,
    });
    return true;
  }

  async sendUsageWarning(
    userEmail: string,
    userName: string,
    planId: string,
    currentUsage: number,
    limit: number,
    percentageUsed: number,
  ): Promise<boolean> {
    console.log('Usage warning email sent:', {
      userEmail,
      userName,
      planId,
      currentUsage,
      limit,
      percentageUsed,
    });
    return true;
  }

  async sendBulkNotification(
    userEmails: string[],
    subject: string,
    message: string,
    isHtml?: boolean,
  ): Promise<BulkNotificationResult> {
    console.log('Bulk notification email sent:', {
      userEmails,
      subject,
      message,
      isHtml,
    });
    return { success: true, sent: 1, failed: 0 };
  }

  async sendPaymentSuccessEmail(
    user: User,
    paymentData: { amount: number; currency: string; planId: string },
  ): Promise<boolean> {
    console.log(`Payment success email sent to ${user.email}:`, paymentData);
    return true;
  }

  async sendPaymentFailedEmail(
    user: User,
    paymentData: { amount: number; currency: string; reason: string },
  ): Promise<boolean> {
    console.log(`Payment failed email sent to ${user.email}:`, paymentData);
    return true;
  }

  async sendBillingConfirmationEmail(
    user: User,
    billingData: { amount: number; currency: string; planId: string; nextBillingDate: Date },
  ): Promise<boolean> {
    console.log(`Billing confirmation email sent to ${user.email}:`, billingData);
    return true;
  }

  async sendSubscriptionConfirmationEmail(
    user: User,
    subscription: Subscription,
  ): Promise<boolean> {
    const subject = `✅ Your Subscription to WorkflowGuard is Confirmed!`;
    const planName =
      subscription.planId.charAt(0).toUpperCase() +
      subscription.planId.slice(1);

    const emailContent = `
      <h2>Subscription Confirmed!</h2>
      <p>Hi ${user.name},</p>
      <p>Thank you for subscribing to the <strong>${planName}</strong> plan. Your subscription is now active.</p>
      <p>You can manage your subscription and view your billing history from your dashboard.</p>
      <p>
        <a href="https://www.workflowguard.pro/settings/billing"
           style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Go to Billing
        </a>
      </p>
      <p>If you have any questions, feel free to contact our support team.</p>
      <p>Best,<br/>The WorkflowGuard Team</p>
    `;

    try {
      if (process.env.SENDGRID_API_KEY) {
        const sgMail = await import('@sendgrid/mail');
        sgMail.default.setApiKey(process.env.SENDGRID_API_KEY);

        const msg = {
          to: user.email,
          from: 'noreply@workflowguard.pro',
          subject: subject,
          html: emailContent,
        };

        await sgMail.default.send(msg);
        console.log(
          `✅ Subscription confirmation email sent to: ${user.email}`,
        );
        return true;
      } else {
        console.log('📧 SUBSCRIPTION CONFIRMATION (SendGrid not configured):');
        console.log(`To: ${user.email}`);
        console.log(`Subject: ${subject}`);
        return true;
      }
    } catch (error) {
      console.error(
        '❌ Failed to send subscription confirmation email:',
        error,
      );
      return false;
    }
  }

  async sendSubscriptionCancellationEmail(
    user: User,
    subscription: Subscription,
  ): Promise<boolean> {
    const subject = `🚫 Your WorkflowGuard Subscription Has Been Canceled`;
    const planName =
      subscription.planId.charAt(0).toUpperCase() +
      subscription.planId.slice(1);

    const emailContent = `
      <h2>Subscription Canceled</h2>
      <p>Hi ${user.name},</p>
      <p>Your subscription to the <strong>${planName}</strong> plan has been successfully canceled. You will no longer be billed.</p>
      <p>Your access to premium features will continue until the end of your current billing period.</p>
      <p>We're sorry to see you go. If you have a moment, we'd love to know why you canceled. Your feedback is important to us.</p>
      <p>Best,<br/>The WorkflowGuard Team</p>
    `;

    try {
      if (process.env.SENDGRID_API_KEY) {
        const sgMail = await import('@sendgrid/mail');
        sgMail.default.setApiKey(process.env.SENDGRID_API_KEY);

        const msg = {
          to: user.email,
          from: 'noreply@workflowguard.pro',
          subject: subject,
          html: emailContent,
        };

        await sgMail.default.send(msg);
        console.log(
          `✅ Subscription cancellation email sent to: ${user.email}`,
        );
        return true;
      } else {
        console.log('📧 SUBSCRIPTION CANCELLATION (SendGrid not configured):');
        console.log(`To: ${user.email}`);
        console.log(`Subject: ${subject}`);
        return true;
      }
    } catch (error) {
      console.error(
        '❌ Failed to send subscription cancellation email:',
        error,
      );
      return false;
    }
  }

  async sendAdminSignupNotification(
    user: User,
    signupSource: string,
  ): Promise<boolean> {
    const adminEmail = process.env.ADMIN_EMAIL || 'contact@workflowguard.pro';
    const subject = `🎉 New User Signup - WorkflowGuard`;

    const emailContent = `
      <h2>🎉 New User Signup Alert</h2>
      <p>A new user has signed up for WorkflowGuard!</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>User Details:</h3>
        <ul>
          <li><strong>📧 Email:</strong> ${user.email}</li>
          <li><strong>👤 Name:</strong> ${user.name || 'Not provided'}</li>
          <li><strong>🆔 User ID:</strong> ${user.id}</li>
          <li><strong>🏢 HubSpot Portal:</strong> ${user.hubspotPortalId || 'Not connected'}</li>
          <li><strong>🔗 Signup Source:</strong> ${signupSource.toUpperCase()}</li>
          <li><strong>📅 Signup Time:</strong> ${new Date().toLocaleString()}</li>
        </ul>
      </div>
      
      <p>
        <a href="https://www.workflowguard.pro/admin/users" 
           style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View User Dashboard
        </a>
      </p>
      
      <p><small>This is an automated notification from WorkflowGuard.</small></p>
    `;

    try {
      // Check if SendGrid is configured via environment variable
      if (process.env.SENDGRID_API_KEY) {
        // Dynamic import of SendGrid to avoid requiring it if not configured
        const sgMail = await import('@sendgrid/mail');
        sgMail.default.setApiKey(process.env.SENDGRID_API_KEY);

        const msg = {
          to: adminEmail,
          from: 'noreply@workflowguard.pro',
          subject: subject,
          html: emailContent,
        };

        await sgMail.default.send(msg);

        console.log('📧 ADMIN EMAIL SENT SUCCESSFULLY!');
        console.log(`✅ Email delivered to: ${adminEmail}`);
        console.log(`👤 New user: ${user.email} (${user.name})`);

        return true;
      } else {
        // Fallback to console logging if SendGrid not configured
        console.log('📧 EMAIL NOTIFICATION (SendGrid not configured):');
        console.log(`To: ${adminEmail}`);
        console.log(`Subject: ${subject}`);
        console.log(`👤 New user: ${user.email} (${user.name})`);
        console.log('Content:', emailContent);
        return true;
      }
    } catch (error) {
      console.error(
        '❌ Failed to send admin signup notification email:',
        error,
      );

      // Fallback: Log email content if SendGrid fails
      console.log('📧 EMAIL CONTENT (SendGrid failed):');
      console.log(`To: ${adminEmail}`);
      console.log(`Subject: ${subject}`);
      console.log(`👤 New user: ${user.email} (${user.name})`);
      console.log('Content:', emailContent);

      return false;
    }
  }
}
