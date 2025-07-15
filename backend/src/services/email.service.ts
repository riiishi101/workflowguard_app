import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface EmailData {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
}

interface OverageAlertData {
  userEmail: string;
  userName: string;
  overageCount: number;
  overageAmount: number;
  period: string;
  planId: string;
  recommendedPlan?: string;
}

interface BillingUpdateData {
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

interface SystemAlertData {
  userEmail: string;
  userName: string;
  alertType: 'plan_upgrade' | 'plan_downgrade' | 'usage_warning' | 'system_maintenance';
  message: string;
  actionRequired?: boolean;
}

interface WelcomeEmailData {
  userEmail: string;
  userName: string;
  planId: string;
  workflowLimit: number;
  features: string[];
}

interface PasswordResetEmailData {
  userEmail: string;
  userName: string;
  resetToken: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly appName: string;
  private readonly supportEmail: string;

  constructor(private configService: ConfigService) {
    this.fromEmail = this.configService.get<string>('EMAIL_FROM', 'noreply@workflowguard.com');
    this.appName = this.configService.get<string>('APP_NAME', 'WorkflowGuard');
    this.supportEmail = this.configService.get<string>('SUPPORT_EMAIL', 'support@workflowguard.com');
  }

  /**
   * Send overage alert email
   */
  async sendOverageAlert(data: OverageAlertData): Promise<boolean> {
    try {
      const template = this.getOverageAlertTemplate(data);
      await this.sendEmail({
        to: data.userEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
      
      this.logger.log(`Overage alert sent to ${data.userEmail}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send overage alert to ${data.userEmail}:`, error);
      return false;
    }
  }

  /**
   * Send billing update email
   */
  async sendBillingUpdate(data: BillingUpdateData): Promise<boolean> {
    try {
      const template = this.getBillingUpdateTemplate(data);
      await this.sendEmail({
        to: data.userEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
      
      this.logger.log(`Billing update sent to ${data.userEmail}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send billing update to ${data.userEmail}:`, error);
      return false;
    }
  }

  /**
   * Send system alert email
   */
  async sendSystemAlert(data: SystemAlertData): Promise<boolean> {
    try {
      const template = this.getSystemAlertTemplate(data);
      await this.sendEmail({
        to: data.userEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
      
      this.logger.log(`System alert sent to ${data.userEmail}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send system alert to ${data.userEmail}:`, error);
      return false;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    try {
      const template = this.getWelcomeEmailTemplate(data);
      await this.sendEmail({
        to: data.userEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
      
      this.logger.log(`Welcome email sent to ${data.userEmail}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${data.userEmail}:`, error);
      return false;
    }
  }

  /**
   * Send upgrade recommendation email
   */
  async sendUpgradeRecommendation(
    userEmail: string,
    userName: string,
    currentPlan: string,
    recommendedPlan: string,
    reason: string
  ): Promise<boolean> {
    try {
      const template = this.getUpgradeRecommendationTemplate({
        userEmail,
        userName,
        currentPlan,
        recommendedPlan,
        reason,
      });
      
      await this.sendEmail({
        to: userEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
      
      this.logger.log(`Upgrade recommendation sent to ${userEmail}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send upgrade recommendation to ${userEmail}:`, error);
      return false;
    }
  }

  /**
   * Send usage warning email
   */
  async sendUsageWarning(
    userEmail: string,
    userName: string,
    planId: string,
    currentUsage: number,
    limit: number,
    percentageUsed: number
  ): Promise<boolean> {
    try {
      const template = this.getUsageWarningTemplate({
        userEmail,
        userName,
        planId,
        currentUsage,
        limit,
        percentageUsed,
      });
      
      await this.sendEmail({
        to: userEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
      
      this.logger.log(`Usage warning sent to ${userEmail}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send usage warning to ${userEmail}:`, error);
      return false;
    }
  }

  /**
   * Send bulk notification to multiple users
   */
  async sendBulkNotification(
    userEmails: string[],
    subject: string,
    message: string,
    isHtml: boolean = true
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const email of userEmails) {
      try {
        await this.sendEmail({
          to: email,
          subject,
          html: isHtml ? message : '',
          text: isHtml ? '' : message,
        });
        success++;
      } catch (error) {
        this.logger.error(`Failed to send bulk notification to ${email}:`, error);
        failed++;
      }
    }

    this.logger.log(`Bulk notification completed: ${success} successful, ${failed} failed`);
    return { success, failed };
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<boolean> {
    try {
      const template = this.getPasswordResetEmailTemplate(data);
      await this.sendEmail({
        to: data.userEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
      this.logger.log(`Password reset email sent to ${data.userEmail}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${data.userEmail}:`, error);
      return false;
    }
  }

  /**
   * Core email sending method
   * This would integrate with your email provider (SendGrid, AWS SES, etc.)
   */
  private async sendEmail(emailData: EmailData): Promise<void> {
    // TODO: Integrate with your email provider
    // Example implementations:
    
    // For SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(this.configService.get('SENDGRID_API_KEY'));
    // await sgMail.send(emailData);
    
    // For AWS SES:
    // const AWS = require('aws-sdk');
    // const ses = new AWS.SES();
    // await ses.sendEmail({
    //   Source: emailData.from || this.fromEmail,
    //   Destination: { ToAddresses: [emailData.to] },
    //   Message: {
    //     Subject: { Data: emailData.subject },
    //     Body: {
    //       Html: { Data: emailData.html },
    //       Text: { Data: emailData.text || this.stripHtml(emailData.html) }
    //     }
    //   }
    // }).promise();
    
    // For development/testing, just log the email
    this.logger.log(`[EMAIL] To: ${emailData.to}, Subject: ${emailData.subject}`);
    this.logger.debug(`[EMAIL HTML] ${emailData.html}`);
  }

  /**
   * Template generators
   */
  private getOverageAlertTemplate(data: OverageAlertData): EmailTemplate {
    const subject = `⚠️ Overage Alert - ${data.overageCount} overages detected`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Overage Alert</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8f9fa; }
          .alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Overage Alert</h1>
          </div>
          <div class="content">
            <p>Hello ${data.userName},</p>
            
            <div class="alert">
              <h3>Overage Detected</h3>
              <p>You have exceeded your ${data.planId} plan limits for ${data.period}.</p>
              <ul>
                <li><strong>Overages:</strong> ${data.overageCount}</li>
                <li><strong>Additional Cost:</strong> $${data.overageAmount.toFixed(2)}</li>
                <li><strong>Period:</strong> ${data.period}</li>
              </ul>
            </div>
            
            ${data.recommendedPlan ? `
              <h3>💡 Recommendation</h3>
              <p>Consider upgrading to our <strong>${data.recommendedPlan}</strong> plan to avoid future overages and get more workflow capacity.</p>
            ` : ''}
            
            <p>
              <a href="${this.getAppUrl()}/settings" class="button">Manage Your Plan</a>
            </p>
            
            <p>If you have any questions, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from ${this.appName}</p>
            <p>Contact: ${this.supportEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Overage Alert

Hello ${data.userName},

You have exceeded your ${data.planId} plan limits for ${data.period}.

OVERAGE DETAILS:
- Overages: ${data.overageCount}
- Additional Cost: $${data.overageAmount.toFixed(2)}
- Period: ${data.period}

${data.recommendedPlan ? `RECOMMENDATION: Consider upgrading to our ${data.recommendedPlan} plan to avoid future overages.` : ''}

Manage your plan: ${this.getAppUrl()}/settings

Contact support: ${this.supportEmail}

This is an automated message from ${this.appName}
    `;

    return { subject, html, text };
  }

  private getBillingUpdateTemplate(data: BillingUpdateData): EmailTemplate {
    const subject = `💰 Billing Update - $${data.billingAmount.toFixed(2)} for ${data.billingPeriod}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Billing Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8f9fa; }
          .billing-summary { background: white; border: 1px solid #dee2e6; padding: 20px; margin: 15px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #dee2e6; }
          th { background: #f8f9fa; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Billing Update</h1>
          </div>
          <div class="content">
            <p>Hello ${data.userName},</p>
            
            <div class="billing-summary">
              <h3>Billing Summary</h3>
              <p><strong>Period:</strong> ${data.billingPeriod}</p>
              <p><strong>Total Amount:</strong> $${data.billingAmount.toFixed(2)}</p>
            </div>
            
            <h3>Overage Details</h3>
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Overages</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${data.overageDetails.map(detail => `
                  <tr>
                    <td>${detail.period}</td>
                    <td>${detail.count}</td>
                    <td>$${detail.amount.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <p>
              <a href="${this.getAppUrl()}/overages" class="button">View Overage Details</a>
            </p>
            
            <p>This amount will be billed through your HubSpot account.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from ${this.appName}</p>
            <p>Contact: ${this.supportEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Billing Update

Hello ${data.userName},

BILLING SUMMARY:
Period: ${data.billingPeriod}
Total Amount: $${data.billingAmount.toFixed(2)}

OVERAGE DETAILS:
${data.overageDetails.map(detail => `${detail.period}: ${detail.count} overages - $${detail.amount.toFixed(2)}`).join('\n')}

View overage details: ${this.getAppUrl()}/overages

This amount will be billed through your HubSpot account.

Contact support: ${this.supportEmail}

This is an automated message from ${this.appName}
    `;

    return { subject, html, text };
  }

  private getSystemAlertTemplate(data: SystemAlertData): EmailTemplate {
    const alertIcons = {
      plan_upgrade: '⬆️',
      plan_downgrade: '⬇️',
      usage_warning: '⚠️',
      system_maintenance: '🔧',
    };

    const subject = `${alertIcons[data.alertType]} System Alert - ${data.alertType.replace('_', ' ').toUpperCase()}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>System Alert</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6c757d; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8f9fa; }
          .alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${alertIcons[data.alertType]} System Alert</h1>
          </div>
          <div class="content">
            <p>Hello ${data.userName},</p>
            
            <div class="alert">
              <h3>${data.alertType.replace('_', ' ').toUpperCase()}</h3>
              <p>${data.message}</p>
              ${data.actionRequired ? '<p><strong>Action Required:</strong> Please review and take necessary action.</p>' : ''}
            </div>
            
            <p>
              <a href="${this.getAppUrl()}/dashboard" class="button">Go to Dashboard</a>
            </p>
            
            <p>If you have any questions, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from ${this.appName}</p>
            <p>Contact: ${this.supportEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
System Alert

Hello ${data.userName},

${data.alertType.replace('_', ' ').toUpperCase()}

${data.message}

${data.actionRequired ? 'ACTION REQUIRED: Please review and take necessary action.' : ''}

Go to dashboard: ${this.getAppUrl()}/dashboard

Contact support: ${this.supportEmail}

This is an automated message from ${this.appName}
    `;

    return { subject, html, text };
  }

  private getWelcomeEmailTemplate(data: WelcomeEmailData): EmailTemplate {
    const subject = `🎉 Welcome to ${this.appName}!`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to ${this.appName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8f9fa; }
          .feature-list { background: white; border: 1px solid #dee2e6; padding: 20px; margin: 15px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to ${this.appName}!</h1>
          </div>
          <div class="content">
            <p>Hello ${data.userName},</p>
            
            <p>Welcome to ${this.appName}! We're excited to help you protect and manage your HubSpot workflows with advanced version control and rollback capabilities.</p>
            
            <div class="feature-list">
              <h3>Your ${data.planId} Plan Includes:</h3>
              <ul>
                <li><strong>Workflow Limit:</strong> ${data.workflowLimit} workflows</li>
                ${data.features.map(feature => `<li>${feature}</li>`).join('')}
              </ul>
            </div>
            
            <h3>🚀 Getting Started</h3>
            <ol>
              <li>Connect your HubSpot workflows</li>
              <li>Set up version control for your workflows</li>
              <li>Configure webhooks for real-time updates</li>
              <li>Monitor your usage and overages</li>
            </ol>
            
            <p>
              <a href="${this.getAppUrl()}/dashboard" class="button">Get Started</a>
            </p>
            
            <p>If you need help getting started, check out our documentation or contact our support team.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from ${this.appName}</p>
            <p>Contact: ${this.supportEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Welcome to ${this.appName}!

Hello ${data.userName},

Welcome to ${this.appName}! We're excited to help you protect and manage your HubSpot workflows with advanced version control and rollback capabilities.

YOUR ${data.planId.toUpperCase()} PLAN INCLUDES:
- Workflow Limit: ${data.workflowLimit} workflows
${data.features.map(feature => `- ${feature}`).join('\n')}

GETTING STARTED:
1. Connect your HubSpot workflows
2. Set up version control for your workflows
3. Configure webhooks for real-time updates
4. Monitor your usage and overages

Get started: ${this.getAppUrl()}/dashboard

If you need help getting started, check out our documentation or contact our support team.

Contact support: ${this.supportEmail}

This is an automated message from ${this.appName}
    `;

    return { subject, html, text };
  }

  private getUpgradeRecommendationTemplate(data: {
    userEmail: string;
    userName: string;
    currentPlan: string;
    recommendedPlan: string;
    reason: string;
  }): EmailTemplate {
    const subject = `💡 Upgrade Recommendation - ${data.recommendedPlan} Plan`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Upgrade Recommendation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ffc107; color: #333; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8f9fa; }
          .recommendation { background: #e7f3ff; border: 1px solid #b3d9ff; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💡 Upgrade Recommendation</h1>
          </div>
          <div class="content">
            <p>Hello ${data.userName},</p>
            
            <div class="recommendation">
              <h3>Recommended Plan Upgrade</h3>
              <p><strong>Current Plan:</strong> ${data.currentPlan}</p>
              <p><strong>Recommended Plan:</strong> ${data.recommendedPlan}</p>
              <p><strong>Reason:</strong> ${data.reason}</p>
            </div>
            
            <h3>Benefits of Upgrading</h3>
            <ul>
              <li>Higher workflow limits</li>
              <li>Reduced overage costs</li>
              <li>Advanced features and capabilities</li>
              <li>Priority support</li>
            </ul>
            
            <p>
              <a href="${this.getAppUrl()}/settings" class="button">Upgrade Now</a>
            </p>
            
            <p>If you have any questions about the upgrade, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from ${this.appName}</p>
            <p>Contact: ${this.supportEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Upgrade Recommendation

Hello ${data.userName},

RECOMMENDED PLAN UPGRADE:
Current Plan: ${data.currentPlan}
Recommended Plan: ${data.recommendedPlan}
Reason: ${data.reason}

BENEFITS OF UPGRADING:
- Higher workflow limits
- Reduced overage costs
- Advanced features and capabilities
- Priority support

Upgrade now: ${this.getAppUrl()}/settings

If you have any questions about the upgrade, please contact our support team.

Contact support: ${this.supportEmail}

This is an automated message from ${this.appName}
    `;

    return { subject, html, text };
  }

  private getUsageWarningTemplate(data: {
    userEmail: string;
    userName: string;
    planId: string;
    currentUsage: number;
    limit: number;
    percentageUsed: number;
  }): EmailTemplate {
    const subject = `⚠️ Usage Warning - ${data.percentageUsed}% of ${data.planId} plan used`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Usage Warning</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #fd7e14; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8f9fa; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .progress { background: #e9ecef; border-radius: 10px; height: 20px; margin: 10px 0; }
          .progress-bar { background: #fd7e14; height: 100%; border-radius: 10px; width: ${data.percentageUsed}%; }
          .button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Usage Warning</h1>
          </div>
          <div class="content">
            <p>Hello ${data.userName},</p>
            
            <div class="warning">
              <h3>Usage Alert</h3>
              <p>You're approaching your ${data.planId} plan limits.</p>
              
              <div class="progress">
                <div class="progress-bar"></div>
              </div>
              
              <p><strong>Current Usage:</strong> ${data.currentUsage} / ${data.limit} workflows (${data.percentageUsed}%)</p>
            </div>
            
            <h3>Options to Consider</h3>
            <ul>
              <li>Review and optimize your workflows</li>
              <li>Upgrade to a higher plan for more capacity</li>
              <li>Contact support for custom solutions</li>
            </ul>
            
            <p>
              <a href="${this.getAppUrl()}/dashboard" class="button">View Usage</a>
              <a href="${this.getAppUrl()}/settings" class="button">Manage Plan</a>
            </p>
            
            <p>If you have any questions, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from ${this.appName}</p>
            <p>Contact: ${this.supportEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Usage Warning

Hello ${data.userName},

USAGE ALERT:
You're approaching your ${data.planId} plan limits.

Current Usage: ${data.currentUsage} / ${data.limit} workflows (${data.percentageUsed}%)

OPTIONS TO CONSIDER:
- Review and optimize your workflows
- Upgrade to a higher plan for more capacity
- Contact support for custom solutions

View usage: ${this.getAppUrl()}/dashboard
Manage plan: ${this.getAppUrl()}/settings

If you have any questions, please contact our support team.

Contact support: ${this.supportEmail}

This is an automated message from ${this.appName}
    `;

    return { subject, html, text };
  }

  private getPasswordResetEmailTemplate(data: PasswordResetEmailData): EmailTemplate {
    const resetUrl = `${this.getAppUrl()}/reset-password?token=${data.resetToken}`;
    const subject = `🔒 Password Reset Request`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset='utf-8'>
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f8f9fa; }
          .button { display: inline-block; padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class='container'>
          <div class='header'>
            <h1>🔒 Password Reset</h1>
          </div>
          <div class='content'>
            <p>Hello ${data.userName},</p>
            <p>We received a request to reset your password for your ${this.appName} account.</p>
            <p>If you did not request this, you can safely ignore this email.</p>
            <p><a href='${resetUrl}' class='button'>Reset Password</a></p>
            <p>This link will expire in 1 hour.</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
          <div class='footer'>
            <p>This is an automated message from ${this.appName}</p>
            <p>Contact: ${this.supportEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `;
    const text = `
Password Reset

Hello ${data.userName},

We received a request to reset your password for your ${this.appName} account.

If you did not request this, you can safely ignore this email.

Reset your password: ${resetUrl}

This link will expire in 1 hour.

Contact support: ${this.supportEmail}

This is an automated message from ${this.appName}
    `;
    return { subject, html, text };
  }

  private getAppUrl(): string {
    return this.configService.get<string>('APP_URL', 'https://www.workflowguard.pro');
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }
} 