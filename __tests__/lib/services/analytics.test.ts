/**
 * Analytics Service Tests
 * Phase 6.2: Test analytics data retrieval and processing
 */

import {
  trackEvent,
  getPainPointsAnalytics,
  getBlogPostAnalytics,
  getNewsletterAnalytics,
  getGitHubIssueAnalytics,
  getDashboardSummary,
  getActivityFeed,
} from '@/lib/services/analytics';
import { db } from '@/lib/db';

// Mock database
jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
}));

describe('Analytics Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('trackEvent', () => {
    it('should track analytics event', async () => {
      const mockInsert = jest.fn().mockReturnThis();
      const mockValues = jest.fn().mockResolvedValue(undefined);

      (db.insert as jest.Mock).mockImplementation(() => ({
        values: mockValues,
      }));

      await trackEvent(
        'user-123',
        'pain_point_discovered',
        { title: 'Test Pain Point' },
        'pp-123',
        'pain_point'
      );

      expect(db.insert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          eventType: 'pain_point_discovered',
        })
      );
    });
  });

  describe('getPainPointsAnalytics', () => {
    it('should return pain points analytics over time', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockReturnThis();
      const mockGroupBy = jest.fn().mockReturnThis();
      const mockOrderBy = jest.fn().mockResolvedValue([
        { date: '2025-10-01', count: 5 },
        { date: '2025-10-02', count: 8 },
      ]);

      (db.select as jest.Mock).mockImplementation(() => ({
        from: mockFrom.mockReturnValue({
          where: mockWhere.mockReturnValue({
            groupBy: mockGroupBy.mockReturnValue({
              orderBy: mockOrderBy,
            }),
          }),
        }),
      }));

      const analytics = await getPainPointsAnalytics('user-123', 30);

      expect(analytics).toBeDefined();
      expect(analytics.overTime).toBeDefined();
      expect(analytics.categoryDistribution).toBeDefined();
      expect(analytics.sourceBreakdown).toBeDefined();
    });

    it('should return category distribution', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockReturnThis();
      const mockGroupBy = jest.fn().mockResolvedValue([
        { category: 'Performance', count: 10 },
        { category: 'UX', count: 15 },
      ]);

      (db.select as jest.Mock).mockImplementation(() => ({
        from: mockFrom.mockReturnValue({
          where: mockWhere.mockReturnValue({
            groupBy: mockGroupBy,
          }),
        }),
      }));

      const analytics = await getPainPointsAnalytics('user-123', 30);

      expect(analytics.categoryDistribution).toBeInstanceOf(Array);
      expect(analytics.categoryDistribution.length).toBeGreaterThan(0);
      expect(analytics.categoryDistribution[0]).toHaveProperty('category');
      expect(analytics.categoryDistribution[0]).toHaveProperty('count');
      expect(analytics.categoryDistribution[0]).toHaveProperty('percentage');
    });
  });

  describe('getBlogPostAnalytics', () => {
    it('should return blog post views over time', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockInnerJoin = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockReturnThis();
      const mockGroupBy = jest.fn().mockReturnThis();
      const mockOrderBy = jest.fn().mockResolvedValue([
        { date: '2025-10-01', views: 100, uniqueVisitors: 80 },
      ]);

      (db.select as jest.Mock).mockImplementation(() => ({
        from: mockFrom.mockReturnValue({
          innerJoin: mockInnerJoin.mockReturnValue({
            where: mockWhere.mockReturnValue({
              groupBy: mockGroupBy.mockReturnValue({
                orderBy: mockOrderBy,
              }),
            }),
          }),
        }),
      }));

      const analytics = await getBlogPostAnalytics('user-123', 30);

      expect(analytics).toBeDefined();
      expect(analytics.viewsOverTime).toBeDefined();
      expect(analytics.popularPosts).toBeDefined();
    });
  });

  describe('getNewsletterAnalytics', () => {
    it('should calculate newsletter engagement rates', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue([
        {
          sent: 5,
          totalRecipients: 500,
          totalOpens: 250,
          totalClicks: 75,
        },
      ]);

      (db.select as jest.Mock).mockImplementation(() => ({
        from: mockFrom.mockReturnValue({
          where: mockWhere,
        }),
      }));

      const analytics = await getNewsletterAnalytics('user-123', 30);

      expect(analytics).toBeDefined();
      expect(analytics.openRate).toBe(50); // 250/500 * 100
      expect(analytics.clickRate).toBe(15); // 75/500 * 100
      expect(analytics.totalSent).toBe(5);
    });

    it('should handle zero recipients gracefully', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue([
        {
          sent: 0,
          totalRecipients: 0,
          totalOpens: 0,
          totalClicks: 0,
        },
      ]);

      (db.select as jest.Mock).mockImplementation(() => ({
        from: mockFrom.mockReturnValue({
          where: mockWhere,
        }),
      }));

      const analytics = await getNewsletterAnalytics('user-123', 30);

      expect(analytics.openRate).toBe(0);
      expect(analytics.clickRate).toBe(0);
    });
  });

  describe('getDashboardSummary', () => {
    it('should calculate monthly statistics with percentage changes', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue([{ count: 10 }]);

      (db.select as jest.Mock).mockImplementation(() => ({
        from: mockFrom.mockReturnValue({
          where: mockWhere,
        }),
      }));

      const summary = await getDashboardSummary('user-123');

      expect(summary).toBeDefined();
      expect(summary).toHaveProperty('painPoints');
      expect(summary).toHaveProperty('blogPosts');
      expect(summary).toHaveProperty('newsletters');
      expect(summary).toHaveProperty('githubIssues');

      expect(summary.painPoints).toHaveProperty('thisMonth');
      expect(summary.painPoints).toHaveProperty('lastMonth');
      expect(summary.painPoints).toHaveProperty('change');
    });
  });

  describe('getActivityFeed', () => {
    it('should return recent activity events', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockReturnThis();
      const mockOrderBy = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue([
        {
          id: 'event-1',
          eventType: 'pain_point_discovered',
          eventData: { title: 'Test' },
          resourceType: 'pain_point',
          createdAt: new Date(),
        },
      ]);

      (db.select as jest.Mock).mockImplementation(() => ({
        from: mockFrom.mockReturnValue({
          where: mockWhere.mockReturnValue({
            orderBy: mockOrderBy.mockReturnValue({
              limit: mockLimit,
            }),
          }),
        }),
      }));

      const feed = await getActivityFeed('user-123', 20);

      expect(feed).toBeDefined();
      expect(feed).toBeInstanceOf(Array);
      expect(feed.length).toBeGreaterThan(0);
      expect(feed[0]).toHaveProperty('eventType');
    });
  });
});
