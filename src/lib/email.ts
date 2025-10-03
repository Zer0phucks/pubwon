/**
 * Email Service Client
 * Phase 1.4: External APIs Setup
 *
 * Unified interface for Resend and SendGrid email services
 */

import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Email provider type
 */
export type EmailProvider = 'resend' | 'sendgrid';

/**
 * Email message structure
 */
export interface EmailMessage {
  to: string | string[];
  from?: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  tags?: Array<{ name: string; value: string }>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

/**
 * Send email using configured provider
 */
export async function sendEmail(message: EmailMessage): Promise<{
  id: string;
  success: boolean;
}> {
  const provider: EmailProvider = process.env.EMAIL_PROVIDER as EmailProvider || 'resend';

  if (provider === 'resend') {
    return await sendEmailResend(message);
  } else if (provider === 'sendgrid') {
    return await sendEmailSendGrid(message);
  }

  throw new Error(`Unsupported email provider: ${provider}`);
}

/**
 * Send email using Resend
 */
async function sendEmailResend(message: EmailMessage): Promise<{
  id: string;
  success: boolean;
}> {
  const from = message.from || process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com';

  try {
    const result = await resend.emails.send({
      from,
      to: Array.isArray(message.to) ? message.to : [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
      reply_to: message.replyTo,
      cc: message.cc,
      bcc: message.bcc,
      tags: message.tags,
      attachments: message.attachments,
    });

    return {
      id: result.data?.id || '',
      success: true,
    };
  } catch (error) {
    console.error('Error sending email with Resend:', error);
    throw error;
  }
}

/**
 * Send email using SendGrid
 */
async function sendEmailSendGrid(message: EmailMessage): Promise<{
  id: string;
  success: boolean;
}> {
  // SendGrid implementation placeholder
  // Install @sendgrid/mail and implement if using SendGrid
  throw new Error('SendGrid implementation not available. Please use Resend or implement SendGrid support.');
}

/**
 * Send bulk emails (batch sending)
 */
export async function sendBulkEmails(
  messages: EmailMessage[]
): Promise<Array<{ id: string; success: boolean; email: string }>> {
  const results = await Promise.allSettled(
    messages.map(async (message) => {
      const result = await sendEmail(message);
      return {
        ...result,
        email: Array.isArray(message.to) ? message.to[0] : message.to,
      };
    })
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        id: '',
        success: false,
        email: Array.isArray(messages[index].to)
          ? messages[index].to[0] as string
          : messages[index].to as string,
      };
    }
  });
}

/**
 * Email Templates
 */

/**
 * Welcome email template
 */
export function generateWelcomeEmail(data: {
  name: string;
  email: string;
}): EmailMessage {
  return {
    to: data.email,
    subject: 'Welcome to PubWon! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to PubWon</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">Welcome to PubWon!</h1>
          </div>

          <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p>Hi ${data.name},</p>

            <p>Welcome to PubWon! We're excited to help you integrate customer discovery into your development workflow.</p>

            <p>Here's what you can do next:</p>

            <ol style="line-height: 2;">
              <li><strong>Connect your GitHub repository</strong> - Let us analyze your project</li>
              <li><strong>Review your ICP persona</strong> - We'll generate it based on your repo</li>
              <li><strong>Monitor relevant subreddits</strong> - Discover what your users are saying</li>
              <li><strong>Start capturing pain points</strong> - Turn insights into GitHub issues</li>
            </ol>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Get Started
              </a>
            </div>

            <p>If you have any questions, just reply to this email. We're here to help!</p>

            <p>Best regards,<br>The PubWon Team</p>
          </div>

          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} PubWon. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `Hi ${data.name},

Welcome to PubWon! We're excited to help you integrate customer discovery into your development workflow.

Here's what you can do next:

1. Connect your GitHub repository - Let us analyze your project
2. Review your ICP persona - We'll generate it based on your repo
3. Monitor relevant subreddits - Discover what your users are saying
4. Start capturing pain points - Turn insights into GitHub issues

Get started: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

If you have any questions, just reply to this email. We're here to help!

Best regards,
The PubWon Team`,
  };
}

/**
 * Newsletter email template
 */
export function generateNewsletterEmail(data: {
  email: string;
  subject: string;
  preheader: string;
  content: string;
  unsubscribeUrl: string;
}): EmailMessage {
  return {
    to: data.email,
    subject: data.subject,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${data.subject}</title>
          <meta name="description" content="${data.preheader}">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h2 style="color: white; margin: 0; font-size: 24px;">PubWon Updates</h2>
            </div>

            <div style="padding: 30px;">
              ${data.content}
            </div>

            <div style="background: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; font-size: 12px; color: #666;">
                You're receiving this because you subscribed to PubWon updates.
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px;">
                <a href="${data.unsubscribeUrl}" style="color: #667eea; text-decoration: none;">
                  Unsubscribe
                </a>
              </p>
            </div>
          </div>

          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} PubWon. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: data.content.replace(/<[^>]*>/g, ''), // Strip HTML tags for plain text
  };
}

/**
 * Pain point notification email
 */
export function generatePainPointEmail(data: {
  email: string;
  painPoints: Array<{
    painPoint: string;
    category: string;
    severity: string;
    evidence: string[];
  }>;
}): EmailMessage {
  const painPointsList = data.painPoints
    .map(
      (pp, i) => `
      <div style="background: #f9f9f9; padding: 15px; margin: 15px 0; border-left: 4px solid ${
        pp.severity === 'high' ? '#e74c3c' : pp.severity === 'medium' ? '#f39c12' : '#3498db'
      }; border-radius: 5px;">
        <h4 style="margin: 0 0 10px 0; color: #333;">
          ${i + 1}. ${pp.painPoint}
        </h4>
        <p style="margin: 5px 0; color: #666; font-size: 14px;">
          <strong>Category:</strong> ${pp.category} |
          <strong>Severity:</strong> ${pp.severity}
        </p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #555;">
          <em>"${pp.evidence[0]}"</em>
        </p>
      </div>
    `
    )
    .join('');

  return {
    to: data.email,
    subject: `${data.painPoints.length} New Pain Points Discovered`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: white; border-radius: 10px; padding: 30px; border: 1px solid #e0e0e0;">
            <h2 style="color: #667eea; margin-top: 0;">🔍 New Pain Points Discovered</h2>

            <p>We've discovered ${data.painPoints.length} new pain points from your target audience on Reddit:</p>

            ${painPointsList}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/pain-points"
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Review Pain Points
              </a>
            </div>

            <p style="color: #666; font-size: 14px;">
              These insights can help you prioritize your roadmap and create features your users actually want.
            </p>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * Subscription confirmation email
 */
export function generateSubscriptionEmail(data: {
  email: string;
  planName: string;
  amount: number;
  billingPeriod: 'monthly' | 'yearly';
}): EmailMessage {
  return {
    to: data.email,
    subject: `Subscription Confirmed - ${data.planName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: white; border-radius: 10px; padding: 30px; border: 1px solid #e0e0e0;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #667eea; margin: 0;">✓ Subscription Confirmed</h1>
            </div>

            <p>Thank you for subscribing to <strong>${data.planName}</strong>!</p>

            <div style="background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">Subscription Details</h3>
              <p style="margin: 10px 0;"><strong>Plan:</strong> ${data.planName}</p>
              <p style="margin: 10px 0;"><strong>Amount:</strong> $${(data.amount / 100).toFixed(2)}/${data.billingPeriod === 'yearly' ? 'year' : 'month'}</p>
              <p style="margin: 10px 0;"><strong>Billing Period:</strong> ${data.billingPeriod === 'yearly' ? 'Annual' : 'Monthly'}</p>
            </div>

            <p>You now have access to all ${data.planName} features. Start exploring!</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Go to Dashboard
              </a>
            </div>

            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              You can manage your subscription anytime from your account settings.
            </p>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Batch emails by provider limits
 */
export function batchEmails(
  emails: EmailMessage[],
  batchSize: number = 100
): EmailMessage[][] {
  const batches: EmailMessage[][] = [];

  for (let i = 0; i < emails.length; i += batchSize) {
    batches.push(emails.slice(i, i + batchSize));
  }

  return batches;
}

/**
 * Track email delivery status
 */
export async function trackEmailDelivery(emailId: string): Promise<{
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained';
  timestamp: Date;
}> {
  // Implementation depends on email provider webhooks
  // This is a placeholder for tracking logic
  throw new Error('Email tracking not implemented yet');
}
