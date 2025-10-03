/**
 * Usage Tracker Service Tests
 * Phase 7.4: Test usage tracking and feature gating
 */

import {
  getUserUsageStatus,
  canPerformAction,
  trackUsage,
  getUserUsageHistory,
} from '@/lib/services/usage-tracker';
import { db } from '@/lib/db';
import { usageTracking, subscriptions } from '@/lib/db/schema';

// Mock database
jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('@/lib/stripe', () => ({
  STRIPE_PLANS: {
    FREE: {
      features: {
        repositories: 1,
        pain_points_per_month: 10,
        blog_posts_per_month: 2,
        newsletters_per_month: 1,
      },
    },
    PRO_MONTHLY: {
      features: {
        repositories: 5,
        pain_points_per_month: 100,
        blog_posts_per_month: 20,
        newsletters_per_month: 10,
      },
    },
  },
  getPlanLimits: jest.fn(),
}));

describe('Usage Tracker Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserUsageStatus', () => {
    it('should return usage status for free tier user', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue([]);

      (db.select as jest.Mock).mockImplementation(() => ({
        from: mockFrom.mockReturnValue({
          where: mockWhere.mockReturnValue({
            limit: mockLimit,
          }),
        }),
      }));

      const status = await getUserUsageStatus('user-123');

      expect(status).toBeDefined();
      expect(status.limits.repositories).toBe(1);
      expect(status.current.repositories).toBeGreaterThanOrEqual(0);
    });
  });

  describe('canPerformAction', () => {
    it('should allow action within limits', async () => {
      // Mock implementation
      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue([
        {
          repositoriesConnected: 0,
          painPointsExtracted: 5,
          blogPostsGenerated: 1,
          newslettersSent: 0,
        },
      ]);

      (db.select as jest.Mock).mockImplementation(() => ({
        from: mockFrom.mockReturnValue({
          where: mockWhere,
        }),
      }));

      const result = await canPerformAction('user-123', 'repository');

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should block action when limit reached', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue([
        {
          repositoriesConnected: 1,
          painPointsExtracted: 10,
          blogPostsGenerated: 2,
          newslettersSent: 1,
        },
      ]);

      (db.select as jest.Mock).mockImplementation(() => ({
        from: mockFrom.mockReturnValue({
          where: mockWhere,
        }),
      }));

      const result = await canPerformAction('user-123', 'repository');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
      expect(result.reason).toContain('limit reached');
    });
  });

  describe('trackUsage', () => {
    it('should increment usage counter', async () => {
      const mockUpdate = jest.fn().mockReturnThis();
      const mockSet = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue(undefined);

      (db.update as jest.Mock).mockImplementation(() => ({
        set: mockSet.mockReturnValue({
          where: mockWhere,
        }),
      }));

      await trackUsage('user-123', 'painPoint', 1);

      expect(db.update).toHaveBeenCalled();
    });
  });

  describe('getUserUsageHistory', () => {
    it('should return usage history for last 12 months', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue([
        {
          month: '2025-10',
          repositoriesConnected: 1,
          painPointsExtracted: 15,
          blogPostsGenerated: 3,
          newslettersSent: 2,
          githubIssuesCreated: 8,
        },
      ]);

      (db.select as jest.Mock).mockImplementation(() => ({
        from: mockFrom.mockReturnValue({
          where: mockWhere,
        }),
      }));

      const history = await getUserUsageHistory('user-123', 12);

      expect(history).toBeDefined();
      expect(history.length).toBe(12);
      expect(history[0]).toHaveProperty('month');
      expect(history[0]).toHaveProperty('painPoints');
    });
  });
});
