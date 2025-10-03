/**
 * Tests for Repository Analyzer Service
 */
import { RepositoryAnalyzer } from '@/lib/services/repository-analyzer';
import { GitHubClient } from '@/lib/github/client';

// Mock GitHubClient
jest.mock('@/lib/github/client');

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
                    primaryLanguages: ['TypeScript', 'JavaScript'],
                    frameworks: ['Next.js', 'React'],
                    purpose: 'Customer discovery and development platform',
                    features: ['GitHub integration', 'Reddit analysis', 'AI-powered content'],
                    targetAudience: 'Software developers and founders',
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

describe('RepositoryAnalyzer', () => {
  let analyzer: RepositoryAnalyzer;
  const mockAccessToken = 'mock_github_token';

  beforeEach(() => {
    analyzer = new RepositoryAnalyzer(mockAccessToken);
    jest.clearAllMocks();
  });

  describe('scanRepository', () => {
    it('should successfully scan a repository', async () => {
      // Mock GitHub responses
      const mockGitHubClient = GitHubClient as jest.MockedClass<typeof GitHubClient>;
      mockGitHubClient.prototype.getRepositoryReadme = jest.fn().mockResolvedValue('# Test Repo\nA test repository');
      mockGitHubClient.prototype.getRepositoryManifest = jest.fn().mockResolvedValue({
        name: 'test-repo',
        version: '1.0.0',
        dependencies: {
          react: '^18.0.0',
          next: '^14.0.0',
        },
      });
      mockGitHubClient.prototype.getRepositoryLanguages = jest.fn().mockResolvedValue({
        TypeScript: 50000,
        JavaScript: 30000,
        CSS: 5000,
      });

      const result = await analyzer.scanRepository('testuser', 'test-repo');

      expect(result).toHaveProperty('readme');
      expect(result).toHaveProperty('packageJson');
      expect(result).toHaveProperty('languages');
      expect(result).toHaveProperty('analysis');

      expect(result.analysis.primaryLanguages).toContain('TypeScript');
      expect(result.analysis.frameworks).toContain('Next.js');
      expect(result.analysis.purpose).toBeTruthy();
    });

    it('should handle missing README gracefully', async () => {
      const mockGitHubClient = GitHubClient as jest.MockedClass<typeof GitHubClient>;
      mockGitHubClient.prototype.getRepositoryReadme = jest.fn().mockResolvedValue(null);
      mockGitHubClient.prototype.getRepositoryManifest = jest.fn().mockResolvedValue(null);
      mockGitHubClient.prototype.getRepositoryLanguages = jest.fn().mockResolvedValue({
        Python: 10000,
      });

      const result = await analyzer.scanRepository('testuser', 'test-repo');

      expect(result.readme).toBeNull();
      expect(result.analysis).toBeDefined();
      expect(result.analysis.primaryLanguages).toContain('Python');
    });

    it('should extract primary languages correctly', async () => {
      const mockGitHubClient = GitHubClient as jest.MockedClass<typeof GitHubClient>;
      mockGitHubClient.prototype.getRepositoryReadme = jest.fn().mockResolvedValue(null);
      mockGitHubClient.prototype.getRepositoryManifest = jest.fn().mockResolvedValue(null);
      mockGitHubClient.prototype.getRepositoryLanguages = jest.fn().mockResolvedValue({
        TypeScript: 100000,
        JavaScript: 50000,
        CSS: 10000,
        HTML: 5000,
      });

      const result = await analyzer.scanRepository('testuser', 'test-repo');

      expect(result.analysis.primaryLanguages).toHaveLength(3);
      expect(result.analysis.primaryLanguages[0]).toBe('TypeScript');
      expect(result.analysis.primaryLanguages[1]).toBe('JavaScript');
      expect(result.analysis.primaryLanguages[2]).toBe('CSS');
    });

    it('should detect frameworks from package.json', async () => {
      const mockGitHubClient = GitHubClient as jest.MockedClass<typeof GitHubClient>;
      mockGitHubClient.prototype.getRepositoryReadme = jest.fn().mockResolvedValue(null);
      mockGitHubClient.prototype.getRepositoryManifest = jest.fn().mockResolvedValue({
        dependencies: {
          react: '^18.0.0',
          vue: '^3.0.0',
          express: '^4.0.0',
        },
      });
      mockGitHubClient.prototype.getRepositoryLanguages = jest.fn().mockResolvedValue({
        JavaScript: 50000,
      });

      const result = await analyzer.scanRepository('testuser', 'test-repo');

      // When AI fails, fallback should detect frameworks
      expect(result.analysis.frameworks).toBeDefined();
    });
  });
});
