/**
 * Email Compliance (CAN-SPAM Act)
 * Manages email subscriptions, unsubscribe, and compliance
 */

import { db } from '@/lib/db';
import { emailSubscribers } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * Generate unsubscribe token
 */
export function generateUnsubscribeToken(email: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET || 'default-secret-change-me';
  const hash = crypto.createHmac('sha256', secret);
  hash.update(email + Date.now().toString());
  return hash.digest('hex');
}

/**
 * Verify unsubscribe token
 */
export function verifyUnsubscribeToken(email: string, token: string): boolean {
  // In production, store tokens in database with expiration
  // This is a simplified version
  return token.length === 64; // Basic validation
}

/**
 * Add required CAN-SPAM headers to email
 */
export function addComplianceHeaders(
  email: {
    to: string;
    subject: string;
    html: string;
  },
  unsubscribeUrl: string
): {
  to: string;
  subject: string;
  html: string;
  headers: Record<string, string>;
} {
  return {
    ...email,
    headers: {
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  };
}

/**
 * Add unsubscribe footer to email content
 */
export function addUnsubscribeFooter(
  htmlContent: string,
  unsubscribeUrl: string,
  physicalAddress: string
): string {
  const footer = `
    <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0 20px 0;" />
    <div style="font-size: 12px; color: #666; text-align: center;">
      <p>
        You're receiving this email because you subscribed to updates from our service.
      </p>
      <p>
        <a href="${unsubscribeUrl}" style="color: #0066cc; text-decoration: underline;">
          Unsubscribe from these emails
        </a>
      </p>
      <p style="margin-top: 20px;">
        ${physicalAddress}
      </p>
    </div>
  `;

  return htmlContent + footer;
}

/**
 * Subscribe email with double opt-in
 */
export async function subscribeEmail(
  email: string,
  userId?: string,
  repositoryId?: string
): Promise<{ success: boolean; requiresConfirmation: boolean }> {
  // Check if already subscribed
  const existing = await db.query.emailSubscribers.findFirst({
    where: eq(emailSubscribers.email, email),
  });

  if (existing) {
    if (existing.status === 'active') {
      return { success: false, requiresConfirmation: false };
    }

    // Reactivate if previously unsubscribed
    if (existing.status === 'unsubscribed') {
      await db.update(emailSubscribers)
        .set({
          status: 'pending',
          subscribedAt: new Date(),
        })
        .where(eq(emailSubscribers.id, existing.id));

      return { success: true, requiresConfirmation: true };
    }
  }

  // Create new subscription
  const confirmationToken = generateUnsubscribeToken(email);

  await db.insert(emailSubscribers).values({
    email,
    userId,
    repositoryId,
    status: 'pending',
    confirmationToken,
    subscribedAt: new Date(),
  });

  return { success: true, requiresConfirmation: true };
}

/**
 * Confirm email subscription
 */
export async function confirmSubscription(
  email: string,
  token: string
): Promise<boolean> {
  const subscriber = await db.query.emailSubscribers.findFirst({
    where: and(
      eq(emailSubscribers.email, email),
      eq(emailSubscribers.confirmationToken, token)
    ),
  });

  if (!subscriber || subscriber.status !== 'pending') {
    return false;
  }

  await db.update(emailSubscribers)
    .set({
      status: 'active',
      confirmedAt: new Date(),
      confirmationToken: null,
    })
    .where(eq(emailSubscribers.id, subscriber.id));

  return true;
}

/**
 * Unsubscribe email
 */
export async function unsubscribeEmail(
  email: string,
  reason?: string
): Promise<boolean> {
  const subscriber = await db.query.emailSubscribers.findFirst({
    where: eq(emailSubscribers.email, email),
  });

  if (!subscriber) {
    return false;
  }

  await db.update(emailSubscribers)
    .set({
      status: 'unsubscribed',
      unsubscribedAt: new Date(),
      unsubscribeReason: reason,
    })
    .where(eq(emailSubscribers.id, subscriber.id));

  return true;
}

/**
 * Handle email bounce
 */
export async function handleEmailBounce(
  email: string,
  bounceType: 'hard' | 'soft' | 'complaint'
): Promise<void> {
  const subscriber = await db.query.emailSubscribers.findFirst({
    where: eq(emailSubscribers.email, email),
  });

  if (!subscriber) {
    return;
  }

  if (bounceType === 'hard' || bounceType === 'complaint') {
    // Immediately unsubscribe for hard bounces and complaints
    await db.update(emailSubscribers)
      .set({
        status: 'bounced',
        unsubscribedAt: new Date(),
        unsubscribeReason: `Email ${bounceType} bounce`,
      })
      .where(eq(emailSubscribers.id, subscriber.id));
  } else {
    // Track soft bounces
    const bounceCount = (subscriber.bounceCount || 0) + 1;

    if (bounceCount >= 5) {
      // Too many soft bounces, unsubscribe
      await db.update(emailSubscribers)
        .set({
          status: 'bounced',
          unsubscribedAt: new Date(),
          bounceCount,
        })
        .where(eq(emailSubscribers.id, subscriber.id));
    } else {
      await db.update(emailSubscribers)
        .set({ bounceCount })
        .where(eq(emailSubscribers.id, subscriber.id));
    }
  }
}

/**
 * Get active subscribers
 */
export async function getActiveSubscribers(
  repositoryId?: string
): Promise<string[]> {
  const query = repositoryId
    ? and(
        eq(emailSubscribers.status, 'active'),
        eq(emailSubscribers.repositoryId, repositoryId)
      )
    : eq(emailSubscribers.status, 'active');

  const subscribers = await db.query.emailSubscribers.findMany({
    where: query,
  });

  return subscribers.map(s => s.email);
}

/**
 * Generate unsubscribe URL
 */
export function generateUnsubscribeUrl(email: string): string {
  const token = generateUnsubscribeToken(email);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/api/unsubscribe/${encodeURIComponent(email)}?token=${token}`;
}

/**
 * CAN-SPAM required physical address
 */
export const PHYSICAL_ADDRESS = process.env.COMPANY_PHYSICAL_ADDRESS ||
  'Your Company Name\n123 Main St\nCity, State 12345\nUnited States';

/**
 * Validate email list before sending
 */
export function validateEmailList(emails: string[]): {
  valid: string[];
  invalid: string[];
} {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const email of emails) {
    if (emailRegex.test(email)) {
      valid.push(email);
    } else {
      invalid.push(email);
    }
  }

  return { valid, invalid };
}
