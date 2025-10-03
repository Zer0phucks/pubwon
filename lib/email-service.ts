import { Resend } from 'resend';
import { supabaseAdmin } from './supabase';
import type { Newsletter, EmailSubscriber } from '@/types/database';

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService {
  async sendNewsletter(newsletter: Newsletter, subscribers: EmailSubscriber[]): Promise<void> {
    const activeSubscribers = subscribers.filter(s => s.status === 'active');
    
    await supabaseAdmin
      .from('newsletters')
      .update({ status: 'sending', recipient_count: activeSubscribers.length })
      .eq('id', newsletter.id);

    let delivered = 0;
    let failed = 0;

    for (const subscriber of activeSubscribers) {
      try {
        const personalizedHtml = this.personalize(newsletter.html_content, subscriber);
        const personalizedText = this.personalize(newsletter.text_content, subscriber);

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: subscriber.email,
          subject: newsletter.subject_line,
          html: personalizedHtml,
          text: personalizedText,
        });

        await supabaseAdmin.from('email_events').insert({
          newsletter_id: newsletter.id,
          subscriber_id: subscriber.id,
          event_type: 'sent',
        });

        delivered++;
      } catch (error) {
        failed++;
        await supabaseAdmin.from('email_events').insert({
          newsletter_id: newsletter.id,
          subscriber_id: subscriber.id,
          event_type: 'bounced',
          event_data: { error: String(error) },
        });
      }
    }

    await supabaseAdmin
      .from('newsletters')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        delivered_count: delivered,
      })
      .eq('id', newsletter.id);
  }

  async subscribeUser(userId: string, email: string, firstName?: string, lastName?: string): Promise<void> {
    await supabaseAdmin.from('email_subscribers').insert({
      user_id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      status: 'pending',
      subscription_source: 'website',
    });
  }

  async confirmSubscription(subscriberId: string): Promise<void> {
    await supabaseAdmin
      .from('email_subscribers')
      .update({ status: 'active', confirmed_at: new Date().toISOString() })
      .eq('id', subscriberId);
  }

  async unsubscribe(subscriberId: string): Promise<void> {
    await supabaseAdmin
      .from('email_subscribers')
      .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
      .eq('id', subscriberId);
  }

  private personalize(content: string, subscriber: EmailSubscriber): string {
    return content
      .replace(/{{FIRST_NAME}}/g, subscriber.first_name || '')
      .replace(/{{LAST_NAME}}/g, subscriber.last_name || '')
      .replace(/{{EMAIL}}/g, subscriber.email)
      .replace(/{{UNSUBSCRIBE_URL}}/g, `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe/${subscriber.id}`);
  }
}
