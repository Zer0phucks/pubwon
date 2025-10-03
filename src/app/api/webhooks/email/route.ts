/**
 * Email webhook handler (Resend)
 * Handles email bounces, opens, and clicks
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyResendSignature } from '@/lib/webhooks/verify';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('svix-signature') || '';

    // Verify webhook signature
    const secret = process.env.RESEND_WEBHOOK_SECRET || '';
    if (!verifyResendSignature(body, signature, secret)) {
      console.error('Invalid Resend webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body);
    const supabase = await createClient();

    const eventType = payload.type;
    const data = payload.data;

    switch (eventType) {
      case 'email.bounced':
        await handleEmailBounce(data, supabase);
        break;

      case 'email.complained':
        await handleEmailComplaint(data, supabase);
        break;

      case 'email.opened':
        await handleEmailOpen(data, supabase);
        break;

      case 'email.clicked':
        await handleEmailClick(data, supabase);
        break;

      case 'email.delivered':
        await handleEmailDelivery(data, supabase);
        break;

      default:
        console.log(`Unhandled email event: ${eventType}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Email webhook error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

async function handleEmailBounce(data: any, supabase: any) {
  const email = data.to;

  // Mark subscriber as bounced
  await supabase
    .from('email_subscribers')
    .update({
      unsubscribed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('email', email);

  console.log(`Email bounced: ${email}`);
}

async function handleEmailComplaint(data: any, supabase: any) {
  const email = data.to;

  // Mark subscriber as unsubscribed due to complaint
  await supabase
    .from('email_subscribers')
    .update({
      unsubscribed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('email', email);

  console.log(`Email complaint: ${email}`);
}

async function handleEmailOpen(data: any, supabase: any) {
  const newsletterId = data.tags?.newsletter_id;

  if (!newsletterId) return;

  // Increment open count
  await supabase.rpc('increment_newsletter_opens', {
    newsletter_id: newsletterId,
  });

  console.log(`Email opened: Newsletter ${newsletterId}`);
}

async function handleEmailClick(data: any, supabase: any) {
  const newsletterId = data.tags?.newsletter_id;

  if (!newsletterId) return;

  // Increment click count
  await supabase.rpc('increment_newsletter_clicks', {
    newsletter_id: newsletterId,
  });

  console.log(`Email link clicked: Newsletter ${newsletterId}`);
}

async function handleEmailDelivery(data: any, supabase: any) {
  console.log(`Email delivered to: ${data.to}`);
}
