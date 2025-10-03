/**
 * Newsletter sending job
 * Sends newsletters to subscribers when new content is available
 */

import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import { generateNewsletter } from '@/lib/ai';
import { JobResult } from './types';

interface NewsletterSendResult {
  newsletterId: string;
  recipientCount: number;
  sent: boolean;
}

export async function sendNewsletters(): Promise<JobResult<NewsletterSendResult[]>> {
  const supabase = await createClient();
  const results: NewsletterSendResult[] = [];
  const warnings: string[] = [];

  try {
    // Get published blog posts from the last week that don't have a sent newsletter
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        content,
        excerpt,
        slug,
        user_id,
        published_at,
        repositories!inner (
          name,
          full_name,
          html_url
        )
      `)
      .eq('is_published', true)
      .gte('published_at', lastWeek.toISOString())
      .is('newsletters.id', null);

    if (blogError) throw blogError;
    if (!blogPosts || blogPosts.length === 0) {
      return {
        success: true,
        data: [],
        warnings: ['No new published blog posts to send newsletters for'],
      };
    }

    // Generate and send newsletter for each blog post
    for (const blogPost of blogPosts) {
      try {
        // Get subscribers for this user
        const { data: subscribers, error: subError } = await supabase
          .from('email_subscribers')
          .select('email')
          .eq('user_id', blogPost.user_id)
          .eq('is_confirmed', true)
          .is('unsubscribed_at', null);

        if (subError) throw subError;
        if (!subscribers || subscribers.length === 0) {
          warnings.push(`No subscribers for blog post: ${blogPost.title}`);
          continue;
        }

        // Generate newsletter content
        const newsletterData = await generateNewsletter({
          blogPost: {
            title: blogPost.title,
            content: blogPost.content,
            excerpt: blogPost.excerpt,
            url: `${process.env.NEXT_PUBLIC_APP_URL}/blog/${blogPost.slug}`,
          },
          repository: {
            name: blogPost.repositories.name,
            fullName: blogPost.repositories.full_name,
            url: blogPost.repositories.html_url,
          },
        });

        if (!newsletterData.success) {
          warnings.push(`Failed to generate newsletter for ${blogPost.title}`);
          continue;
        }

        // Create newsletter record
        const { data: newsletter, error: newsletterError } = await supabase
          .from('newsletters')
          .insert({
            blog_post_id: blogPost.id,
            user_id: blogPost.user_id,
            subject: newsletterData.subject,
            html_content: newsletterData.htmlContent,
            text_content: newsletterData.textContent,
            recipient_count: subscribers.length,
            is_sent: false,
          })
          .select('id')
          .single();

        if (newsletterError) throw newsletterError;

        // Send emails to all subscribers
        let sentCount = 0;
        const batchSize = 50; // Send in batches to avoid rate limits

        for (let i = 0; i < subscribers.length; i += batchSize) {
          const batch = subscribers.slice(i, i + batchSize);

          await Promise.all(
            batch.map(async (subscriber) => {
              try {
                await sendEmail({
                  to: subscriber.email,
                  subject: newsletterData.subject,
                  html: newsletterData.htmlContent,
                  text: newsletterData.textContent,
                  tags: ['newsletter', blogPost.slug],
                });
                sentCount++;
              } catch (error) {
                warnings.push(`Failed to send email to ${subscriber.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            })
          );

          // Small delay between batches
          if (i + batchSize < subscribers.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        // Update newsletter as sent
        await supabase
          .from('newsletters')
          .update({
            is_sent: true,
            sent_at: new Date().toISOString(),
          })
          .eq('id', newsletter.id);

        // Create analytics event
        await supabase
          .from('analytics_events')
          .insert({
            user_id: blogPost.user_id,
            event_type: 'newsletter_sent',
            event_data: {
              blogPost: blogPost.title,
              recipientCount: sentCount,
            },
            resource_id: newsletter.id,
            resource_type: 'newsletter',
          });

        results.push({
          newsletterId: newsletter.id,
          recipientCount: sentCount,
          sent: true,
        });

      } catch (error) {
        warnings.push(`Failed to send newsletter for ${blogPost.title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        continue;
      }
    }

    return {
      success: true,
      data: results,
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata: {
        blogPostsProcessed: blogPosts.length,
        newslettersSent: results.length,
        totalRecipients: results.reduce((sum, r) => sum + r.recipientCount, 0),
      },
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
