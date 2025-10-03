/**
 * Reddit API Client
 * Phase 1.4: External APIs Setup
 *
 * Handles Reddit authentication and data fetching using snoowrap
 */

import Snoowrap from 'snoowrap';

// Initialize Reddit client with credentials
export function createRedditClient(): Snoowrap {
  if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET) {
    throw new Error('Missing Reddit API credentials');
  }

  return new Snoowrap({
    userAgent: process.env.REDDIT_USER_AGENT || 'pubwon:v1.0.0',
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_CLIENT_SECRET,
    username: process.env.REDDIT_USERNAME,
    password: process.env.REDDIT_PASSWORD,
  });
}

/**
 * Get hot posts from a subreddit
 */
export async function getHotPosts(
  subredditName: string,
  options: {
    limit?: number;
    timeFilter?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
  } = {}
) {
  const reddit = createRedditClient();

  const posts = await reddit
    .getSubreddit(subredditName)
    .getHot({ limit: options.limit || 25 });

  return posts.map(post => ({
    id: post.id,
    title: post.title,
    selftext: post.selftext,
    author: post.author.name,
    score: post.score,
    num_comments: post.num_comments,
    created_utc: post.created_utc,
    url: post.url,
    permalink: post.permalink,
    subreddit: post.subreddit.display_name,
    upvote_ratio: post.upvote_ratio,
    is_self: post.is_self,
  }));
}

/**
 * Get new posts from a subreddit
 */
export async function getNewPosts(
  subredditName: string,
  options: {
    limit?: number;
  } = {}
) {
  const reddit = createRedditClient();

  const posts = await reddit
    .getSubreddit(subredditName)
    .getNew({ limit: options.limit || 25 });

  return posts.map(post => ({
    id: post.id,
    title: post.title,
    selftext: post.selftext,
    author: post.author.name,
    score: post.score,
    num_comments: post.num_comments,
    created_utc: post.created_utc,
    url: post.url,
    permalink: post.permalink,
    subreddit: post.subreddit.display_name,
    upvote_ratio: post.upvote_ratio,
    is_self: post.is_self,
  }));
}

/**
 * Get top posts from a subreddit
 */
export async function getTopPosts(
  subredditName: string,
  options: {
    limit?: number;
    timeFilter?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
  } = {}
) {
  const reddit = createRedditClient();

  const posts = await reddit
    .getSubreddit(subredditName)
    .getTop({
      limit: options.limit || 25,
      time: options.timeFilter || 'week',
    });

  return posts.map(post => ({
    id: post.id,
    title: post.title,
    selftext: post.selftext,
    author: post.author.name,
    score: post.score,
    num_comments: post.num_comments,
    created_utc: post.created_utc,
    url: post.url,
    permalink: post.permalink,
    subreddit: post.subreddit.display_name,
    upvote_ratio: post.upvote_ratio,
    is_self: post.is_self,
  }));
}

/**
 * Get comments from a post
 */
export async function getPostComments(
  postId: string,
  options: {
    limit?: number;
    depth?: number;
  } = {}
) {
  const reddit = createRedditClient();

  const submission = await reddit.getSubmission(postId);
  const comments = await submission.comments.fetchAll({
    limit: options.limit || 100,
    depth: options.depth || 5,
  });

  function flattenComments(commentList: any[], depth = 0): any[] {
    const flattened: any[] = [];

    for (const comment of commentList) {
      if (comment.body && comment.body !== '[deleted]' && comment.body !== '[removed]') {
        flattened.push({
          id: comment.id,
          body: comment.body,
          author: comment.author?.name || '[deleted]',
          score: comment.score,
          created_utc: comment.created_utc,
          parent_id: comment.parent_id,
          depth,
        });
      }

      if (comment.replies && comment.replies.length > 0) {
        flattened.push(...flattenComments(comment.replies, depth + 1));
      }
    }

    return flattened;
  }

  return flattenComments(comments);
}

/**
 * Get subreddit information
 */
export async function getSubredditInfo(subredditName: string) {
  const reddit = createRedditClient();
  const subreddit = await reddit.getSubreddit(subredditName).fetch();

  return {
    name: subreddit.display_name,
    title: subreddit.title,
    description: subreddit.public_description,
    subscribers: subreddit.subscribers,
    active_users: subreddit.active_user_count,
    created_utc: subreddit.created_utc,
    over_18: subreddit.over18,
    url: subreddit.url,
  };
}

/**
 * Search for subreddits
 */
export async function searchSubreddits(
  query: string,
  options: {
    limit?: number;
  } = {}
) {
  const reddit = createRedditClient();

  const results = await reddit.searchSubreddits({
    query,
    limit: options.limit || 25,
  });

  return results.map(subreddit => ({
    name: subreddit.display_name,
    title: subreddit.title,
    description: subreddit.public_description,
    subscribers: subreddit.subscribers,
    active_users: subreddit.active_user_count,
    over_18: subreddit.over18,
    url: subreddit.url,
  }));
}

/**
 * Search posts across Reddit
 */
export async function searchPosts(
  query: string,
  options: {
    subreddit?: string;
    sort?: 'relevance' | 'hot' | 'top' | 'new' | 'comments';
    time?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
    limit?: number;
  } = {}
) {
  const reddit = createRedditClient();

  const searchOptions: any = {
    query,
    sort: options.sort || 'relevance',
    time: options.time || 'all',
    limit: options.limit || 25,
  };

  let results;
  if (options.subreddit) {
    results = await reddit.getSubreddit(options.subreddit).search(searchOptions);
  } else {
    results = await reddit.search(searchOptions);
  }

  return results.map((post: any) => ({
    id: post.id,
    title: post.title,
    selftext: post.selftext,
    author: post.author.name,
    score: post.score,
    num_comments: post.num_comments,
    created_utc: post.created_utc,
    url: post.url,
    permalink: post.permalink,
    subreddit: post.subreddit.display_name,
    upvote_ratio: post.upvote_ratio,
    is_self: post.is_self,
  }));
}

/**
 * Get trending subreddits
 */
export async function getTrendingSubreddits() {
  const reddit = createRedditClient();
  const trending = await reddit.getTrendingSubreddits();

  return trending.map(subreddit => ({
    name: subreddit.display_name,
    title: subreddit.title,
    description: subreddit.public_description,
    subscribers: subreddit.subscribers,
    url: subreddit.url,
  }));
}

/**
 * Get subreddit rules
 */
export async function getSubredditRules(subredditName: string) {
  const reddit = createRedditClient();
  const rules = await reddit.getSubreddit(subredditName).getRules();

  return rules.rules.map((rule: any) => ({
    short_name: rule.short_name,
    description: rule.description,
    kind: rule.kind,
    violation_reason: rule.violation_reason,
  }));
}

/**
 * Filter posts by engagement threshold
 */
export function filterByEngagement<T extends { score: number; num_comments: number }>(
  posts: T[],
  minScore: number = 10,
  minComments: number = 5
): T[] {
  return posts.filter(
    post => post.score >= minScore && post.num_comments >= minComments
  );
}

/**
 * Filter posts by recency
 */
export function filterByRecency<T extends { created_utc: number }>(
  posts: T[],
  maxAgeInDays: number = 7
): T[] {
  const cutoffTime = Date.now() / 1000 - maxAgeInDays * 24 * 60 * 60;
  return posts.filter(post => post.created_utc >= cutoffTime);
}

/**
 * Extract keywords from post text
 */
export function extractKeywords(text: string): string[] {
  // Remove common words and extract meaningful terms
  const commonWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
    'in', 'with', 'to', 'for', 'of', 'as', 'by', 'from', 'this', 'that',
    'it', 'be', 'are', 'was', 'were', 'been', 'being', 'have', 'has', 'had',
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));

  // Count frequency and return unique keywords
  const frequency = new Map<string, number>();
  words.forEach(word => {
    frequency.set(word, (frequency.get(word) || 0) + 1);
  });

  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
}

/**
 * Calculate post engagement score
 */
export function calculateEngagementScore(post: {
  score: number;
  num_comments: number;
  upvote_ratio: number;
  created_utc: number;
}): number {
  const ageInHours = (Date.now() / 1000 - post.created_utc) / 3600;
  const recencyMultiplier = Math.max(0.1, 1 - ageInHours / 168); // Decay over 1 week

  const baseScore = post.score * post.upvote_ratio;
  const commentBonus = post.num_comments * 2;

  return (baseScore + commentBonus) * recencyMultiplier;
}

/**
 * Types
 */
export type RedditPost = Awaited<ReturnType<typeof getHotPosts>>[number];
export type RedditComment = Awaited<ReturnType<typeof getPostComments>>[number];
export type SubredditInfo = Awaited<ReturnType<typeof getSubredditInfo>>;
