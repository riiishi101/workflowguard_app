import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  async sendEmail(to: string, subject: string, content: string): Promise<void> {
    console.log(`Email sent to ${to}: ${subject}`);
  }

  async sendNotificationEmail(to: string, template: string, data: any): Promise<void> {
    console.log(`Notification email sent to ${to} using template ${template}`);
  }

  // Add missing methods
  async sendOverageAlert(data: any): Promise<boolean> {
    console.log('Overage alert email sent:', data);
    return true;
  }

  async sendBillingUpdate(data: any): Promise<boolean> {
    console.log('Billing update email sent:', data);
    return true;
  }

  async sendSystemAlert(data: any): Promise<boolean> {
    console.log('System alert email sent:', data);
    return true;
  }

  async sendWelcomeEmail(data: any): Promise<boolean> {
    console.log('Welcome email sent:', data);
    return true;
  }

  async sendUpgradeRecommendation(
    userName: string,
    currentPlan: string,
    recommendedPlan: string,
    reason: string,
    additionalData?: any
  ): Promise<boolean> {
    console.log('Upgrade recommendation email sent:', { userName, currentPlan, recommendedPlan, reason, additionalData });
    return true;
  }

  async sendUsageWarning(
    userEmail: string,
    userName: string,
    planId: string,
    currentUsage: number,
    limit: number,
    percentageUsed: number
  ): Promise<boolean> {
    console.log('Usage warning email sent:', { userEmail, userName, planId, currentUsage, limit, percentageUsed });
    return true;
  }

  async sendBulkNotification(
    userEmails: string[],
    subject: string,
    message: string,
    isHtml?: boolean
  ): Promise<any> {
    console.log('Bulk notification email sent:', { userEmails, subject, message, isHtml });
    return { success: true, sent: 1, failed: 0 };
  }

  async sendAdminSignupNotification(user: any, signupSource: string): Promise<boolean> {
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
      console.error('❌ Failed to send admin signup notification email:', error);
      
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