import { redditClient } from '../lib/reddit-client';

describe('RedditClient', () => {
  describe('Rate Limiting', () => {
    it('should respect rate limits between requests', async () => {
      const startTime = Date.now();
      
      // Make two consecutive requests
      await redditClient.searchSubreddits('javascript', 5);
      await redditClient.searchSubreddits('typescript', 5);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should take at least 2 seconds due to rate limiting
      expect(duration).toBeGreaterThanOrEqual(2000);
    });

    it('should queue multiple requests properly', async () => {
      const promises = [
        redditClient.searchSubreddits('react', 3),
        redditClient.searchSubreddits('vue', 3),
        redditClient.searchSubreddits('angular', 3),
      ];

      const results = await Promise.all(promises);
      
      // All requests should complete successfully
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });

  describe('getTopPosts', () => {
    it('should fetch top posts from subreddit', async () => {
      const posts = await redditClient.getTopPosts('programming', 'week', 5);
      
      expect(Array.isArray(posts)).toBe(true);
      expect(posts.length).toBeGreaterThan(0);
      expect(posts.length).toBeLessThanOrEqual(5);
      
      const firstPost = posts[0];
      expect(firstPost).toHaveProperty('id');
      expect(firstPost).toHaveProperty('title');
      expect(firstPost).toHaveProperty('author');
      expect(firstPost).toHaveProperty('score');
      expect(firstPost).toHaveProperty('url');
    });

    it('should return posts with required fields', async () => {
      const posts = await redditClient.getTopPosts('javascript', 'day', 3);
      
      posts.forEach(post => {
        expect(typeof post.id).toBe('string');
        expect(typeof post.title).toBe('string');
        expect(typeof post.author).toBe('string');
        expect(typeof post.score).toBe('number');
        expect(typeof post.num_comments).toBe('number');
        expect(typeof post.url).toBe('string');
        expect(typeof post.created_utc).toBe('number');
      });
    });
  });

  describe('getSubredditInfo', () => {
    it('should fetch subreddit information', async () => {
      const info = await redditClient.getSubredditInfo('programming');
      
      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('subscribers');
      expect(typeof info.name).toBe('string');
      expect(typeof info.subscribers).toBe('number');
      expect(info.subscribers).toBeGreaterThan(0);
    });
  });
});
