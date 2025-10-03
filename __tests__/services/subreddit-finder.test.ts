/**
 * Tests for Subreddit Finder Service
 */
import { SubredditFinder } from '@/lib/services/subreddit-finder';
import type { ICPPersona } from '@/types';

// Mock Snoowrap
jest.mock('snoowrap', () => {
  return jest.fn().mockImplementation(() => ({
    getSubreddit: jest.fn((name: string) => ({
      fetch: jest.fn().mockResolvedValue({
        display_name: name,
        public_description: `A community for ${name} enthusiasts`,
        description: `Welcome to r/${name}`,
        subscribers: 50000,
      }),
    })),
    searchSubreddits: jest.fn().mockResolvedValue([
      {
        display_name: 'programming',
        public_description: 'Computer programming',
        subscribers: 500000,
      },
      {
        display_name: 'webdev',
        public_description: 'Web development',
        subscribers: 300000,
      },
    ]),
  }));
});

// Mock OpenAI
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    subreddits: [
                      'programming',
                      'webdev',
                      'javascript',
                      'reactjs',
                      'node',
                      'typescript',
                      'cscareerquestions',
                      'startups',
                    ],
                  }),
                },
              },
            ],
          }),
        },
      },
    })),
  };
});

describe('SubredditFinder', () => {
  let finder: SubredditFinder;

  beforeEach(() => {
    finder = new SubredditFinder();
    jest.clearAllMocks();
  });

  describe('discoverSubreddits', () => {
    it('should discover relevant subreddits based on persona', async () => {
      const persona: ICPPersona = {
        id: '1',
        repositoryId: 'repo1',
        userId: 'user1',
        name: 'Senior Developer',
        demographics: {
          occupation: ['Software Developer'],
          experience: 'Senior',
        },
        goals: ['Build better software'],
        painPoints: ['Lack of documentation'],
        motivations: ['Career growth'],
        useCases: ['Web development'],
        technicalSkills: ['JavaScript', 'TypeScript'],
        preferredPlatforms: ['GitHub', 'Reddit'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const suggestions = await finder.discoverSubreddits(persona);

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);

      suggestions.forEach((suggestion) => {
        expect(suggestion).toHaveProperty('name');
        expect(suggestion).toHaveProperty('displayName');
        expect(suggestion).toHaveProperty('subscribers');
        expect(suggestion).toHaveProperty('relevanceScore');
      });
    });

    it('should sort subreddits by relevance score', async () => {
      const persona: ICPPersona = {
        id: '1',
        repositoryId: 'repo1',
        userId: 'user1',
        name: 'Developer',
        demographics: {},
        goals: [],
        painPoints: [],
        motivations: [],
        useCases: [],
        technicalSkills: ['Python'],
        preferredPlatforms: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const suggestions = await finder.discoverSubreddits(persona);

      // Verify sorting
      for (let i = 0; i < suggestions.length - 1; i++) {
        expect(suggestions[i].relevanceScore).toBeGreaterThanOrEqual(
          suggestions[i + 1].relevanceScore
        );
      }
    });

    it('should filter out subreddits with low subscriber count', async () => {
      const persona: ICPPersona = {
        id: '1',
        repositoryId: 'repo1',
        userId: 'user1',
        name: 'Developer',
        demographics: {},
        goals: [],
        painPoints: [],
        motivations: [],
        useCases: [],
        technicalSkills: [],
        preferredPlatforms: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const suggestions = await finder.discoverSubreddits(persona);

      suggestions.forEach((suggestion) => {
        expect(suggestion.subscribers).toBeGreaterThan(1000);
      });
    });
  });

  describe('searchSubreddits', () => {
    it('should search for subreddits by keyword', async () => {
      const results = await finder.searchSubreddits('programming');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      results.forEach((result) => {
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('subscribers');
      });
    });

    it('should apply subscriber filter to search results', async () => {
      const results = await finder.searchSubreddits('test');

      results.forEach((result) => {
        expect(result.subscribers).toBeGreaterThan(1000);
      });
    });
  });

  describe('calculateRelevanceScore', () => {
    it('should assign higher scores to moderately-sized communities', () => {
      // Access private method through instance (for testing)
      const scores = [
        { subs: 500, expectedRange: [10, 30] },
        { subs: 5000, expectedRange: [40, 60] },
        { subs: 50000, expectedRange: [70, 90] },
        { subs: 200000, expectedRange: [90, 100] },
        { subs: 5000000, expectedRange: [60, 80] },
      ];

      scores.forEach(({ subs, expectedRange }) => {
        const score = (finder as any).calculateRelevanceScore(subs);
        expect(score).toBeGreaterThanOrEqual(expectedRange[0]);
        expect(score).toBeLessThanOrEqual(expectedRange[1]);
      });
    });
  });
});
