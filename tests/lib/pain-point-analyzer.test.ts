import { PainPointAnalyzer, ExtractedPainPoint } from '@/lib/pain-point-analyzer';
import OpenAI from 'openai';

jest.mock('openai');
jest.mock('@/lib/db');

describe('PainPointAnalyzer', () => {
  let analyzer: PainPointAnalyzer;
  let mockOpenAI: jest.Mocked<OpenAI>;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key';

    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    } as any;

    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAI);
    analyzer = new PainPointAnalyzer();
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  describe('constructor', () => {
    it('should throw error if OPENAI_API_KEY is not set', () => {
      delete process.env.OPENAI_API_KEY;
      expect(() => new PainPointAnalyzer()).toThrow('OPENAI_API_KEY is not configured');
    });
  });

  describe('analyzeDiscussion', () => {
    const mockDiscussion = {
      post: {
        id: 'test123',
        title: 'Test Post',
        selftext: 'This is a test post',
        score: 100,
        num_comments: 10,
        author: 'testuser',
        created_utc: 1234567890,
        url: 'https://reddit.com/r/test/comments/test123',
        permalink: '/r/test/comments/test123',
        subreddit: 'test',
      },
      comments: [
        { author: 'user1', body: 'This is slow and frustrating', score: 50, created_utc: 1234567891 },
        { author: 'user2', body: 'Documentation is unclear', score: 30, created_utc: 1234567892 },
      ],
    };

    const mockICPPersona = {
      demographics: 'Software developers',
      goals: ['Build fast applications'],
      pain_points: ['Performance issues'],
    };

    it('should analyze discussion and extract pain points', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              painPoints: [
                {
                  title: 'Performance issues with large datasets',
                  description: 'Users report slow processing times',
                  category: 'Performance',
                  severity: 'high',
                  evidence: ['This is slow and frustrating'],
                },
              ],
            }),
          },
        }],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const result = await analyzer.analyzeDiscussion(mockDiscussion, mockICPPersona);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Performance issues with large datasets');
      expect(result[0].severity).toBe('high');
      expect(result[0].category).toBe('Performance');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4',
          response_format: { type: 'json_object' },
        })
      );
    });

    it('should validate and normalize pain points', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              painPoints: [
                {
                  title: 'A'.repeat(250), // Too long
                  description: 'Test description',
                  category: 'Test',
                  severity: 'invalid-severity',
                  evidence: Array(10).fill('evidence'), // Too many
                },
              ],
            }),
          },
        }],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const result = await analyzer.analyzeDiscussion(mockDiscussion, mockICPPersona);

      expect(result[0].title).toHaveLength(200); // Truncated
      expect(result[0].severity).toBe('medium'); // Defaulted
      expect(result[0].evidence).toHaveLength(5); // Limited
    });

    it('should filter out invalid pain points', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              painPoints: [
                {
                  title: 'Valid Pain Point',
                  description: 'Description',
                  category: 'Test',
                  severity: 'high',
                  evidence: [],
                },
                {
                  // Missing required fields
                  title: 'Invalid',
                },
              ],
            }),
          },
        }],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const result = await analyzer.analyzeDiscussion(mockDiscussion, mockICPPersona);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Valid Pain Point');
    });

    it('should handle API errors', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

      await expect(analyzer.analyzeDiscussion(mockDiscussion, mockICPPersona)).rejects.toThrow('API Error');
    });
  });

  describe('analyzeBatch', () => {
    const mockDiscussions = [
      {
        post: {
          id: 'post1',
          title: 'Post 1',
          selftext: 'Content 1',
          score: 100,
          num_comments: 10,
          author: 'user1',
          created_utc: 1234567890,
          url: 'https://reddit.com/r/test/comments/post1',
          permalink: '/r/test/comments/post1',
          subreddit: 'test',
        },
        comments: [],
      },
      {
        post: {
          id: 'post2',
          title: 'Post 2',
          selftext: 'Content 2',
          score: 50,
          num_comments: 5,
          author: 'user2',
          created_utc: 1234567891,
          url: 'https://reddit.com/r/test/comments/post2',
          permalink: '/r/test/comments/post2',
          subreddit: 'test',
        },
        comments: [],
      },
    ];

    it('should analyze multiple discussions', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              painPoints: [
                {
                  title: 'Test Pain Point',
                  description: 'Description',
                  category: 'Performance',
                  severity: 'high',
                  evidence: ['test'],
                },
              ],
            }),
          },
        }],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const result = await analyzer.analyzeBatch(mockDiscussions, {});

      expect(result.painPoints.length).toBeGreaterThan(0);
      expect(result.themes).toContain('Performance');
      expect(result.summary).toContain('2 discussions');
    });

    it('should group similar pain points', async () => {
      const mockResponse1 = {
        choices: [{
          message: {
            content: JSON.stringify({
              painPoints: [
                {
                  title: 'Same Pain Point',
                  description: 'Description 1',
                  category: 'Performance',
                  severity: 'high',
                  evidence: ['evidence1'],
                },
              ],
            }),
          },
        }],
      };

      const mockResponse2 = {
        choices: [{
          message: {
            content: JSON.stringify({
              painPoints: [
                {
                  title: 'Same Pain Point',
                  description: 'Description 2',
                  category: 'Performance',
                  severity: 'critical',
                  evidence: ['evidence2'],
                },
              ],
            }),
          },
        }],
      };

      mockOpenAI.chat.completions.create
        .mockResolvedValueOnce(mockResponse1 as any)
        .mockResolvedValueOnce(mockResponse2 as any);

      const result = await analyzer.analyzeBatch(mockDiscussions, {});

      // Should have 1 grouped pain point with combined evidence and highest severity
      const painPoint = result.painPoints.find(pp => pp.title === 'Same Pain Point');
      expect(painPoint).toBeDefined();
      expect(painPoint!.severity).toBe('critical');
      expect(painPoint!.evidence.length).toBeGreaterThan(1);
    });

    it('should handle errors gracefully', async () => {
      mockOpenAI.chat.completions.create
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: JSON.stringify({
                painPoints: [
                  {
                    title: 'Valid Pain Point',
                    description: 'Description',
                    category: 'Test',
                    severity: 'high',
                    evidence: [],
                  },
                ],
              }),
            },
          }],
        } as any)
        .mockRejectedValueOnce(new Error('API Error'));

      const result = await analyzer.analyzeBatch(mockDiscussions, {});

      // Should still return results from successful analysis
      expect(result.painPoints.length).toBeGreaterThan(0);
    });
  });

  describe('rankPainPoints', () => {
    it('should rank pain points by severity and evidence', () => {
      const painPoints: ExtractedPainPoint[] = [
        {
          title: 'Low Priority',
          description: 'Desc',
          category: 'Test',
          severity: 'low',
          evidence: ['e1'],
        },
        {
          title: 'High Priority',
          description: 'Desc',
          category: 'Test',
          severity: 'critical',
          evidence: ['e1', 'e2', 'e3'],
        },
        {
          title: 'Medium Priority',
          description: 'Desc',
          category: 'Test',
          severity: 'high',
          evidence: ['e1'],
        },
      ];

      const ranked = (analyzer as any).rankPainPoints(painPoints);

      expect(ranked[0].title).toBe('High Priority');
      expect(ranked[1].title).toBe('Medium Priority');
      expect(ranked[2].title).toBe('Low Priority');
    });
  });

  describe('categorizePainPoints', () => {
    it('should categorize pain points', async () => {
      const painPoints: ExtractedPainPoint[] = [
        {
          title: 'Performance Issue',
          description: 'Desc',
          category: 'Performance',
          severity: 'high',
          evidence: [],
        },
        {
          title: 'Documentation Issue',
          description: 'Desc',
          category: 'Documentation',
          severity: 'medium',
          evidence: [],
        },
        {
          title: 'Another Performance Issue',
          description: 'Desc',
          category: 'Performance',
          severity: 'low',
          evidence: [],
        },
      ];

      const categorized = await analyzer.categorizePainPoints(painPoints);

      expect(categorized.size).toBe(2);
      expect(categorized.get('Performance')).toHaveLength(2);
      expect(categorized.get('Documentation')).toHaveLength(1);
    });
  });
});
