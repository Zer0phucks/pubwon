import { GitHubScanner } from '@/lib/github-scanner';
import { Octokit } from '@octokit/rest';

// Mock Octokit
jest.mock('@octokit/rest');
jest.mock('@/lib/supabase');

describe('GitHubScanner', () => {
  let scanner: GitHubScanner;
  let mockOctokit: jest.Mocked<Octokit>;

  beforeEach(() => {
    mockOctokit = {
      repos: {
        listCommits: jest.fn(),
        listReleases: jest.fn(),
        getCommit: jest.fn(),
      },
      pulls: {
        list: jest.fn(),
      },
      issues: {
        listForRepo: jest.fn(),
      },
    } as any;

    (Octokit as jest.MockedClass<typeof Octokit>).mockImplementation(() => mockOctokit);
    scanner = new GitHubScanner('test-token');
  });

  describe('scanRepository', () => {
    it('should scan repository and return activity summary', async () => {
      const mockCommits = [
        {
          sha: 'abc123',
          commit: {
            message: 'Test commit',
            author: { name: 'Test Author', date: '2024-01-01T00:00:00Z' },
          },
          html_url: 'https://github.com/test/repo/commit/abc123',
        },
      ];

      const mockPRs = [
        {
          number: 1,
          title: 'Test PR',
          merged_at: '2024-01-01T00:00:00Z',
          html_url: 'https://github.com/test/repo/pull/1',
        },
      ];

      const mockIssues = [
        {
          number: 1,
          title: 'Test Issue',
          closed_at: '2024-01-01T00:00:00Z',
          html_url: 'https://github.com/test/repo/issues/1',
        },
      ];

      const mockReleases = [
        {
          tag_name: 'v1.0.0',
          name: 'Version 1.0',
          published_at: '2024-01-01T00:00:00Z',
          html_url: 'https://github.com/test/repo/releases/v1.0.0',
        },
      ];

      mockOctokit.repos.listCommits.mockResolvedValue({ data: mockCommits } as any);
      mockOctokit.pulls.list.mockResolvedValue({ data: mockPRs } as any);
      mockOctokit.issues.listForRepo.mockResolvedValue({ data: mockIssues } as any);
      mockOctokit.repos.listReleases.mockResolvedValue({ data: mockReleases } as any);
      mockOctokit.repos.getCommit.mockResolvedValue({ data: { files: [] } } as any);

      const since = new Date('2024-01-01');
      const result = await scanner.scanRepository('test-owner', 'test-repo', since);

      expect(result.commits).toHaveLength(1);
      expect(result.commits[0].sha).toBe('abc123');
      expect(result.pull_requests).toHaveLength(1);
      expect(result.issues).toHaveLength(1);
      expect(result.releases).toHaveLength(1);
      expect(result.contributors).toContain('Test Author');
    });

    it('should handle API errors gracefully', async () => {
      mockOctokit.repos.listCommits.mockRejectedValue(new Error('API Error'));
      mockOctokit.pulls.list.mockRejectedValue(new Error('API Error'));
      mockOctokit.issues.listForRepo.mockRejectedValue(new Error('API Error'));
      mockOctokit.repos.listReleases.mockRejectedValue(new Error('API Error'));
      mockOctokit.repos.getCommit.mockRejectedValue(new Error('API Error'));

      const since = new Date('2024-01-01');
      const result = await scanner.scanRepository('test-owner', 'test-repo', since);

      expect(result.commits).toHaveLength(0);
      expect(result.pull_requests).toHaveLength(0);
      expect(result.issues).toHaveLength(0);
      expect(result.releases).toHaveLength(0);
    });

    it('should filter out pull requests from issues', async () => {
      const mockIssues = [
        {
          number: 1,
          title: 'Real Issue',
          closed_at: '2024-01-01T00:00:00Z',
          html_url: 'https://github.com/test/repo/issues/1',
        },
        {
          number: 2,
          title: 'PR Issue',
          closed_at: '2024-01-01T00:00:00Z',
          html_url: 'https://github.com/test/repo/issues/2',
          pull_request: { url: 'https://api.github.com/repos/test/repo/pulls/2' },
        },
      ];

      mockOctokit.repos.listCommits.mockResolvedValue({ data: [] } as any);
      mockOctokit.pulls.list.mockResolvedValue({ data: [] } as any);
      mockOctokit.issues.listForRepo.mockResolvedValue({ data: mockIssues } as any);
      mockOctokit.repos.listReleases.mockResolvedValue({ data: [] } as any);
      mockOctokit.repos.getCommit.mockResolvedValue({ data: { files: [] } } as any);

      const since = new Date('2024-01-01');
      const result = await scanner.scanRepository('test-owner', 'test-repo', since);

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].title).toBe('Real Issue');
    });
  });

  describe('isSignificantActivity', () => {
    it('should return true for significant activity', () => {
      const summary = {
        commits: Array(5).fill({ sha: '123', message: 'test', author: 'dev', date: '', url: '' }),
        pull_requests: [{ number: 1, title: 'PR', merged_at: '', url: '' }],
        issues: [{ number: 1, title: 'Issue', closed_at: '', url: '' }],
        releases: [],
        contributors: ['dev1'],
        files_changed: ['file1.ts'],
      };

      const result = GitHubScanner.isSignificantActivity(summary);
      expect(result).toBe(true);
    });

    it('should return false for insignificant activity', () => {
      const summary = {
        commits: [{ sha: '123', message: 'test', author: 'dev', date: '', url: '' }],
        pull_requests: [],
        issues: [],
        releases: [],
        contributors: ['dev1'],
        files_changed: ['file1.ts'],
      };

      const result = GitHubScanner.isSignificantActivity(summary);
      expect(result).toBe(false);
    });

    it('should weight releases heavily', () => {
      const summary = {
        commits: [],
        pull_requests: [],
        issues: [],
        releases: [{ tag_name: 'v1.0', name: 'Release', published_at: '', url: '' }],
        contributors: [],
        files_changed: [],
      };

      const result = GitHubScanner.isSignificantActivity(summary);
      expect(result).toBe(true); // 1 release = 20 points > 10 threshold
    });

    it('should calculate correct significance score', () => {
      const summary = {
        commits: Array(2).fill({ sha: '123', message: 'test', author: 'dev', date: '', url: '' }),
        pull_requests: [{ number: 1, title: 'PR', merged_at: '', url: '' }],
        issues: [{ number: 1, title: 'Issue', closed_at: '', url: '' }],
        releases: [],
        contributors: ['dev1'],
        files_changed: ['file1.ts'],
      };

      // Score = 2*1 + 1*5 + 1*3 = 10 (exactly at threshold)
      const result = GitHubScanner.isSignificantActivity(summary);
      expect(result).toBe(true);
    });
  });
});
