import { GitHubClient } from '../lib/github-client';
import { ExtractedPainPoint } from '../lib/pain-point-analyzer';

describe('GitHubClient', () => {
  let client: GitHubClient;

  beforeAll(() => {
    if (!process.env.GITHUB_TOKEN) {
      console.warn('Skipping GitHub tests - GITHUB_TOKEN not set');
    }
  });

  beforeEach(() => {
    if (process.env.GITHUB_TOKEN) {
      client = new GitHubClient(process.env.GITHUB_TOKEN);
    }
  });

  describe('painPointToIssue', () => {
    it('should convert pain point to GitHub issue format', () => {
      if (!client) return;

      const painPoint: ExtractedPainPoint = {
        title: 'Performance degradation with large datasets',
        description: 'Users experience significant slowdowns when working with datasets larger than 10k rows.',
        category: 'Performance',
        severity: 'high',
        evidence: [
          'It takes forever to load',
          'The UI freezes completely',
          'This is unusable for our workflow',
        ],
      };

      const issue = client.painPointToIssue(painPoint);

      expect(issue.title).toBe(painPoint.title);
      expect(issue.body).toContain(painPoint.description);
      expect(issue.body).toContain(painPoint.category);
      expect(issue.body).toContain(painPoint.severity);
      expect(issue.labels).toContain('customer-discovery');
      expect(issue.labels).toContain('severity-high');
      
      painPoint.evidence.forEach(evidence => {
        expect(issue.body).toContain(evidence);
      });
    });

    it('should include all severity levels in labels', () => {
      if (!client) return;

      const severities: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];
      
      severities.forEach(severity => {
        const painPoint: ExtractedPainPoint = {
          title: 'Test Issue',
          description: 'Test description',
          category: 'Test',
          severity,
          evidence: [],
        };

        const issue = client.painPointToIssue(painPoint);
        expect(issue.labels).toContain(`severity-${severity}`);
      });
    });
  });

  describe('checkDuplicateIssue', () => {
    it('should detect existing issues with same title', async () => {
      if (!client || !process.env.GITHUB_TOKEN) {
        console.warn('Skipping test - GITHUB_TOKEN not set');
        return;
      }

      // This test requires a real repository
      // For now, just test that the method is callable
      const isDuplicate = await client.checkDuplicateIssue(
        'octocat',
        'Hello-World',
        'Nonexistent Issue Title 123456789'
      );

      expect(typeof isDuplicate).toBe('boolean');
    }, 10000);
  });

  describe('Integration Tests', () => {
    it('should have proper error handling for invalid credentials', async () => {
      const invalidClient = new GitHubClient('invalid_token_12345');
      
      await expect(
        invalidClient.listUserRepositories()
      ).rejects.toThrow();
    });
  });
});
