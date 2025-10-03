import Snoowrap from 'snoowrap';

export interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  author: string;
  score: number;
  num_comments: number;
  url: string;
  created_utc: number;
  subreddit: string;
}

export interface RedditComment {
  id: string;
  body: string;
  author: string;
  score: number;
  created_utc: number;
}

class RedditClient {
  private client: Snoowrap | null = null;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private readonly REQUEST_DELAY = 2000; // 2 seconds between requests
  private lastRequestTime = 0;

  private getClient(): Snoowrap {
    if (!this.client) {
      if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET) {
        throw new Error('Reddit API credentials not configured');
      }

      this.client = new Snoowrap({
        userAgent: process.env.REDDIT_USER_AGENT || 'pubwon/1.0.0',
        clientId: process.env.REDDIT_CLIENT_ID,
        clientSecret: process.env.REDDIT_CLIENT_SECRET,
        refreshToken: '', // Using client credentials flow
      });

      // Configure rate limiting
      this.client.config({
        requestDelay: this.REQUEST_DELAY,
        continueAfterRatelimitError: true,
        warnings: true,
        maxRetryAttempts: 3,
      });
    }

    return this.client;
  }

  private async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      if (timeSinceLastRequest < this.REQUEST_DELAY) {
        await new Promise(resolve => 
          setTimeout(resolve, this.REQUEST_DELAY - timeSinceLastRequest)
        );
      }

      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
          this.lastRequestTime = Date.now();
        } catch (error) {
          console.error('Reddit API request failed:', error);
          throw error;
        }
      }
    }

    this.isProcessing = false;
  }

  private enqueueRequest<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  async searchSubreddits(query: string, limit: number = 10): Promise<string[]> {
    return this.enqueueRequest(async () => {
      const client = this.getClient();
      const results = await client.searchSubreddits({ query, limit });
      return results.map(sub => sub.display_name);
    });
  }

  async getSubredditInfo(subredditName: string) {
    return this.enqueueRequest(async () => {
      const client = this.getClient();
      const subreddit = await client.getSubreddit(subredditName);
      
      return {
        name: subreddit.display_name,
        description: subreddit.public_description,
        subscribers: subreddit.subscribers,
        activeUsers: subreddit.active_user_count,
      };
    });
  }

  async getTopPosts(
    subredditName: string,
    timeframe: 'hour' | 'day' | 'week' | 'month' | 'year' = 'week',
    limit: number = 25
  ): Promise<RedditPost[]> {
    return this.enqueueRequest(async () => {
      const client = this.getClient();
      const subreddit = client.getSubreddit(subredditName);
      const posts = await subreddit.getTop({ time: timeframe, limit });

      return posts.map(post => ({
        id: post.id,
        title: post.title,
        selftext: post.selftext || '',
        author: post.author.name,
        score: post.score,
        num_comments: post.num_comments,
        url: `https://reddit.com${post.permalink}`,
        created_utc: post.created_utc,
        subreddit: post.subreddit.display_name,
      }));
    });
  }

  async getPostComments(postId: string, limit: number = 50): Promise<RedditComment[]> {
    return this.enqueueRequest(async () => {
      const client = this.getClient();
      const submission = await client.getSubmission(postId);
      const comments = await submission.comments.fetchAll({ limit });

      const extractComments = (commentList: any[]): RedditComment[] => {
        const result: RedditComment[] = [];
        
        for (const comment of commentList) {
          if (comment.body && comment.author) {
            result.push({
              id: comment.id,
              body: comment.body,
              author: comment.author.name,
              score: comment.score,
              created_utc: comment.created_utc,
            });

            // Recursively get replies
            if (comment.replies && Array.isArray(comment.replies)) {
              result.push(...extractComments(comment.replies));
            }
          }
        }

        return result;
      };

      return extractComments(comments);
    });
  }

  async getHotPosts(subredditName: string, limit: number = 25): Promise<RedditPost[]> {
    return this.enqueueRequest(async () => {
      const client = this.getClient();
      const subreddit = client.getSubreddit(subredditName);
      const posts = await subreddit.getHot({ limit });

      return posts.map(post => ({
        id: post.id,
        title: post.title,
        selftext: post.selftext || '',
        author: post.author.name,
        score: post.score,
        num_comments: post.num_comments,
        url: `https://reddit.com${post.permalink}`,
        created_utc: post.created_utc,
        subreddit: post.subreddit.display_name,
      }));
    });
  }

  async getNewPosts(subredditName: string, limit: number = 25): Promise<RedditPost[]> {
    return this.enqueueRequest(async () => {
      const client = this.getClient();
      const subreddit = client.getSubreddit(subredditName);
      const posts = await subreddit.getNew({ limit });

      return posts.map(post => ({
        id: post.id,
        title: post.title,
        selftext: post.selftext || '',
        author: post.author.name,
        score: post.score,
        num_comments: post.num_comments,
        url: `https://reddit.com${post.permalink}`,
        created_utc: post.created_utc,
        subreddit: post.subreddit.display_name,
      }));
    });
  }
}

export const redditClient = new RedditClient();
