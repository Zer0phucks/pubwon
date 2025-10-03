import { redditClient, RedditPost, RedditComment } from './reddit-client';
import { db } from './db';
import { redditDiscussions, subreddits } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export interface ScrapedDiscussion {
  post: RedditPost;
  comments: RedditComment[];
}

export class RedditScraper {
  async scrapeSubreddit(
    subredditName: string,
    timeframe: 'hour' | 'day' | 'week' | 'month' = 'week',
    postLimit: number = 25
  ): Promise<ScrapedDiscussion[]> {
    console.log(`Scraping r/${subredditName}...`);

    try {
      // Fetch top posts
      const posts = await redditClient.getTopPosts(subredditName, timeframe, postLimit);
      console.log(`Found ${posts.length} posts in r/${subredditName}`);

      // Fetch comments for each post
      const discussions: ScrapedDiscussion[] = [];

      for (const post of posts) {
        try {
          // Only fetch comments if the post has a reasonable number
          if (post.num_comments > 0 && post.num_comments < 1000) {
            const comments = await redditClient.getPostComments(post.id, 50);
            discussions.push({ post, comments });
          } else {
            discussions.push({ post, comments: [] });
          }

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error fetching comments for post ${post.id}:`, error);
          discussions.push({ post, comments: [] });
        }
      }

      return discussions;
    } catch (error) {
      console.error(`Error scraping r/${subredditName}:`, error);
      throw error;
    }
  }

  async storeDiscussions(
    subredditId: string,
    discussions: ScrapedDiscussion[]
  ): Promise<void> {
    console.log(`Storing ${discussions.length} discussions...`);

    for (const discussion of discussions) {
      try {
        // Check if discussion already exists
        const existing = await db.query.redditDiscussions.findFirst({
          where: eq(redditDiscussions.redditPostId, discussion.post.id),
        });

        if (!existing) {
          await db.insert(redditDiscussions).values({
            subredditId,
            redditPostId: discussion.post.id,
            title: discussion.post.title,
            content: discussion.post.selftext,
            url: discussion.post.url,
            author: discussion.post.author,
            score: discussion.post.score,
            numComments: discussion.post.num_comments,
            rawData: {
              post: discussion.post,
              comments: discussion.comments,
            },
          });
        }
      } catch (error) {
        console.error(`Error storing discussion ${discussion.post.id}:`, error);
      }
    }
  }

  async scrapeAllActiveSubreddits(): Promise<void> {
    console.log('Starting scheduled Reddit scraping...');

    try {
      // Get all active subreddits
      const activeSubreddits = await db.query.subreddits.findMany({
        where: eq(subreddits.isActive, true),
      });

      console.log(`Found ${activeSubreddits.length} active subreddits`);

      for (const subreddit of activeSubreddits) {
        try {
          console.log(`Processing r/${subreddit.name}...`);

          // Scrape discussions
          const discussions = await this.scrapeSubreddit(subreddit.name, 'week', 25);

          // Store in database
          await this.storeDiscussions(subreddit.id, discussions);

          console.log(`Completed r/${subreddit.name}`);

          // Delay between subreddits to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (error) {
          console.error(`Error processing r/${subreddit.name}:`, error);
          // Continue with next subreddit
        }
      }

      console.log('Scheduled Reddit scraping completed');
    } catch (error) {
      console.error('Error in scrapeAllActiveSubreddits:', error);
      throw error;
    }
  }

  filterRelevantDiscussions(
    discussions: ScrapedDiscussion[],
    keywords: string[]
  ): ScrapedDiscussion[] {
    return discussions.filter(discussion => {
      const titleLower = discussion.post.title.toLowerCase();
      const contentLower = discussion.post.selftext.toLowerCase();
      const commentsText = discussion.comments
        .map(c => c.body.toLowerCase())
        .join(' ');

      const allText = `${titleLower} ${contentLower} ${commentsText}`;

      // Check if any keyword appears in the discussion
      return keywords.some(keyword => 
        allText.includes(keyword.toLowerCase())
      );
    });
  }

  async analyzeDiscussionRelevance(
    discussion: ScrapedDiscussion,
    icpPersona: any
  ): Promise<number> {
    // Calculate relevance score based on:
    // 1. Keyword matching
    // 2. Post score (popularity)
    // 3. Number of comments (engagement)
    // 4. Recency

    let score = 0;

    // Score based on upvotes (0-30 points)
    score += Math.min(discussion.post.score / 10, 30);

    // Score based on comments (0-20 points)
    score += Math.min(discussion.post.num_comments / 5, 20);

    // Score based on recency (0-20 points)
    const daysSincePost = (Date.now() / 1000 - discussion.post.created_utc) / 86400;
    score += Math.max(20 - daysSincePost, 0);

    // Score based on keyword matching (0-30 points)
    if (icpPersona.painPoints) {
      const keywords = icpPersona.painPoints.flatMap((pp: any) => 
        pp.keywords || []
      );
      
      const titleLower = discussion.post.title.toLowerCase();
      const contentLower = discussion.post.selftext.toLowerCase();
      
      const matchCount = keywords.filter((kw: string) => 
        titleLower.includes(kw.toLowerCase()) || 
        contentLower.includes(kw.toLowerCase())
      ).length;

      score += Math.min(matchCount * 10, 30);
    }

    return Math.round(score);
  }
}

export const redditScraper = new RedditScraper();
