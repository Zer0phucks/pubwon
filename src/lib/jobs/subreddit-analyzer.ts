/**
 * Weekly subreddit analysis job
 * Monitors subreddits for pain points and trending discussions
 */

import { createClient } from '@/lib/supabase/server';
import { createRedditClient } from '@/lib/reddit';
import { generatePainPointAnalysis } from '@/lib/ai';
import { JobResult } from './types';

interface SubredditAnalysis {
  subredditId: string;
  postsAnalyzed: number;
  painPointsFound: number;
  topCategories: string[];
}

export async function analyzeSubreddits(): Promise<JobResult<SubredditAnalysis[]>> {
  const supabase = await createClient();
  const analyses: SubredditAnalysis[] = [];
  const warnings: string[] = [];

  try {
    // Get all monitored subreddits
    const { data: subreddits, error: subredditError } = await supabase
      .from('subreddits')
      .select(`
        id,
        name,
        user_id,
        icp_persona_id,
        icp_personas!inner (
          id,
          name,
          pain_points,
          goals,
          technical_skills
        )
      `)
      .eq('is_monitored', true);

    if (subredditError) throw subredditError;
    if (!subreddits || subreddits.length === 0) {
      return {
        success: true,
        data: [],
        warnings: ['No subreddits to monitor'],
      };
    }

    const reddit = createRedditClient();

    // Analyze each subreddit
    for (const subreddit of subreddits) {
      try {
        const subredditInstance = reddit.getSubreddit(subreddit.name);

        // Get top and hot posts from the last week
        const [topPosts, hotPosts] = await Promise.all([
          subredditInstance.getTop({ time: 'week', limit: 50 }),
          subredditInstance.getHot({ limit: 30 }),
        ]);

        const allPosts = [...topPosts, ...hotPosts];
        const postsAnalyzed = allPosts.length;

        // Extract pain points using AI
        const painPointsData = await generatePainPointAnalysis({
          posts: allPosts.map(post => ({
            title: post.title,
            selftext: post.selftext,
            score: post.score,
            num_comments: post.num_comments,
            url: `https://reddit.com${post.permalink}`,
            id: post.id,
          })),
          icpPersona: subreddit.icp_personas,
        });

        if (!painPointsData.success || !painPointsData.painPoints) {
          warnings.push(`Failed to analyze subreddit ${subreddit.name}`);
          continue;
        }

        // Store pain points in database
        const painPoints = painPointsData.painPoints;
        const categories = new Set<string>();

        for (const painPoint of painPoints) {
          const { error: insertError } = await supabase
            .from('pain_points')
            .insert({
              subreddit_id: subreddit.id,
              icp_persona_id: subreddit.icp_persona_id,
              user_id: subreddit.user_id,
              title: painPoint.title,
              description: painPoint.description,
              category: painPoint.category,
              severity: painPoint.severity,
              frequency: painPoint.frequency,
              source_url: painPoint.sourceUrl,
              source_post_id: painPoint.sourcePostId,
              is_approved: false,
            });

          if (!insertError && painPoint.category) {
            categories.add(painPoint.category);
          }
        }

        // Create analytics event
        await supabase
          .from('analytics_events')
          .insert({
            user_id: subreddit.user_id,
            event_type: 'pain_points_discovered',
            event_data: {
              subreddit: subreddit.name,
              painPointsCount: painPoints.length,
              categories: Array.from(categories),
            },
            resource_id: subreddit.id,
            resource_type: 'subreddit',
          });

        analyses.push({
          subredditId: subreddit.id,
          postsAnalyzed,
          painPointsFound: painPoints.length,
          topCategories: Array.from(categories).slice(0, 5),
        });

      } catch (error) {
        warnings.push(`Failed to analyze subreddit ${subreddit.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        continue;
      }
    }

    return {
      success: true,
      data: analyses,
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata: {
        totalSubreddits: subreddits.length,
        analyzedSubreddits: analyses.length,
        totalPainPointsFound: analyses.reduce((sum, a) => sum + a.painPointsFound, 0),
      },
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
