/**
 * Daily blog post generation job
 * Generates blog posts from repository activity
 */

import { createClient } from '@/lib/supabase/server';
import { generateBlogPost } from '@/lib/ai';
import { JobResult } from './types';

interface BlogGenerationResult {
  repositoryId: string;
  blogPostId: string;
  title: string;
  generated: boolean;
}

export async function generateBlogPosts(): Promise<JobResult<BlogGenerationResult[]>> {
  const supabase = await createClient();
  const results: BlogGenerationResult[] = [];
  const warnings: string[] = [];

  try {
    // Get repositories with recent activity (from analytics events)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: activityEvents, error: eventError } = await supabase
      .from('analytics_events')
      .select(`
        resource_id,
        user_id,
        event_data,
        repositories!inner (
          id,
          name,
          full_name,
          description,
          html_url,
          language,
          topics
        )
      `)
      .eq('event_type', 'repository_activity_detected')
      .gte('created_at', yesterday.toISOString());

    if (eventError) throw eventError;
    if (!activityEvents || activityEvents.length === 0) {
      return {
        success: true,
        data: [],
        warnings: ['No repository activity to generate content from'],
      };
    }

    // Generate blog post for each active repository
    for (const event of activityEvents) {
      try {
        const repo = event.repositories;
        const activity = event.event_data;

        // Check if blog post was already generated today
        const today = new Date().toISOString().split('T')[0];
        const { data: existingPost } = await supabase
          .from('blog_posts')
          .select('id')
          .eq('repository_id', repo.id)
          .gte('created_at', `${today}T00:00:00`)
          .single();

        if (existingPost) {
          warnings.push(`Blog post already generated today for ${repo.full_name}`);
          continue;
        }

        // Generate blog post content
        const blogData = await generateBlogPost({
          repository: {
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description,
            url: repo.html_url,
            language: repo.language,
            topics: repo.topics || [],
          },
          activity: {
            commits: activity.commits || 0,
            pullRequests: activity.pullRequests || 0,
            closedIssues: activity.closedIssues || 0,
            releases: activity.releases || 0,
          },
        });

        if (!blogData.success || !blogData.content) {
          warnings.push(`Failed to generate blog post for ${repo.full_name}`);
          continue;
        }

        // Create slug from title
        const slug = blogData.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        // Insert blog post into database
        const { data: blogPost, error: insertError } = await supabase
          .from('blog_posts')
          .insert({
            repository_id: repo.id,
            user_id: event.user_id,
            title: blogData.title,
            slug: `${slug}-${Date.now()}`,
            content: blogData.content,
            excerpt: blogData.excerpt,
            seo_title: blogData.seoTitle,
            seo_description: blogData.seoDescription,
            tags: blogData.tags || [],
            is_published: false, // Requires manual approval
          })
          .select('id, title')
          .single();

        if (insertError) throw insertError;

        // Create analytics event
        await supabase
          .from('analytics_events')
          .insert({
            user_id: event.user_id,
            event_type: 'blog_post_generated',
            event_data: {
              repository: repo.full_name,
              title: blogData.title,
            },
            resource_id: blogPost.id,
            resource_type: 'blog_post',
          });

        results.push({
          repositoryId: repo.id,
          blogPostId: blogPost.id,
          title: blogPost.title,
          generated: true,
        });

      } catch (error) {
        warnings.push(`Failed to generate blog for repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
        continue;
      }
    }

    return {
      success: true,
      data: results,
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata: {
        repositoriesProcessed: activityEvents.length,
        blogPostsGenerated: results.length,
      },
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
