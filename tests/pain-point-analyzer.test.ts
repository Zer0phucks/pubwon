import { painPointAnalyzer, ExtractedPainPoint } from '../lib/pain-point-analyzer';
import { ScrapedDiscussion } from '../lib/reddit-scraper';

describe('PainPointAnalyzer', () => {
  const mockDiscussion: ScrapedDiscussion = {
    post: {
      id: 'test123',
      title: 'Performance issues with large datasets',
      selftext: 'I am experiencing severe performance degradation when working with datasets larger than 10k rows. The UI freezes and becomes unresponsive.',
      author: 'testuser',
      score: 150,
      num_comments: 25,
      url: 'https://reddit.com/r/test/123',
      created_utc: Date.now() / 1000,
      subreddit: 'test',
    },
    comments: [
      {
        id: 'c1',
        body: 'I have the same issue! It takes forever to load.',
        author: 'user1',
        score: 50,
        created_utc: Date.now() / 1000,
      },
      {
        id: 'c2',
        body: 'This is a critical problem for our workflow.',
        author: 'user2',
        score: 30,
        created_utc: Date.now() / 1000,
      },
    ],
  };

  const mockPersona = {
    name: 'Data Analyst',
    goals: ['Efficient data processing', 'Fast visualizations'],
    painPoints: [
      { keywords: ['performance', 'slow', 'freeze'] },
    ],
  };

  describe('analyzeDiscussion', () => {
    it('should extract pain points from discussion', async () => {
      // Note: This test requires OpenAI API key
      if (!process.env.OPENAI_API_KEY) {
        console.warn('Skipping test - OPENAI_API_KEY not set');
        return;
      }

      const painPoints = await painPointAnalyzer.analyzeDiscussion(
        mockDiscussion,
        mockPersona
      );

      expect(Array.isArray(painPoints)).toBe(true);
      
      if (painPoints.length > 0) {
        const painPoint = painPoints[0];
        expect(painPoint).toHaveProperty('title');
        expect(painPoint).toHaveProperty('description');
        expect(painPoint).toHaveProperty('category');
        expect(painPoint).toHaveProperty('severity');
        expect(painPoint).toHaveProperty('evidence');
        expect(['low', 'medium', 'high', 'critical']).toContain(painPoint.severity);
      }
    }, 30000);
  });

  describe('groupSimilarPainPoints', () => {
    it('should group pain points with same title', () => {
      const painPoints: ExtractedPainPoint[] = [
        {
          title: 'Slow Performance',
          description: 'App is slow',
          category: 'Performance',
          severity: 'high',
          evidence: ['quote1'],
        },
        {
          title: 'Slow Performance',
          description: 'App is very slow',
          category: 'Performance',
          severity: 'critical',
          evidence: ['quote2'],
        },
      ];

      // Access private method through type assertion for testing
      const analyzer = painPointAnalyzer as any;
      const grouped = analyzer.groupSimilarPainPoints(painPoints);

      expect(grouped).toHaveLength(1);
      expect(grouped[0].severity).toBe('critical'); // Should upgrade severity
      expect(grouped[0].evidence).toHaveLength(2);
    });
  });

  describe('rankPainPoints', () => {
    it('should rank pain points by severity and evidence', () => {
      const painPoints: ExtractedPainPoint[] = [
        {
          title: 'Low Priority Issue',
          description: 'Minor issue',
          category: 'UX',
          severity: 'low',
          evidence: ['quote1'],
        },
        {
          title: 'Critical Issue',
          description: 'Critical problem',
          category: 'Performance',
          severity: 'critical',
          evidence: ['quote1', 'quote2', 'quote3'],
        },
        {
          title: 'Medium Issue',
          description: 'Medium problem',
          category: 'Features',
          severity: 'medium',
          evidence: ['quote1', 'quote2'],
        },
      ];

      const analyzer = painPointAnalyzer as any;
      const ranked = analyzer.rankPainPoints(painPoints);

      expect(ranked[0].title).toBe('Critical Issue');
      expect(ranked[ranked.length - 1].title).toBe('Low Priority Issue');
    });
  });

  describe('categorizePainPoints', () => {
    it('should categorize pain points by category', async () => {
      const painPoints: ExtractedPainPoint[] = [
        {
          title: 'Slow Loading',
          description: 'Pages load slowly',
          category: 'Performance',
          severity: 'high',
          evidence: [],
        },
        {
          title: 'Confusing UI',
          description: 'UI is confusing',
          category: 'Usability',
          severity: 'medium',
          evidence: [],
        },
        {
          title: 'Memory Leak',
          description: 'Memory leaks over time',
          category: 'Performance',
          severity: 'critical',
          evidence: [],
        },
      ];

      const categorized = await painPointAnalyzer.categorizePainPoints(painPoints);

      expect(categorized.size).toBe(2);
      expect(categorized.get('Performance')).toHaveLength(2);
      expect(categorized.get('Usability')).toHaveLength(1);
    });
  });
});
