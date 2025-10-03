import { BlogGenerator } from '@/lib/blog-generator';
import OpenAI from 'openai';

jest.mock('openai');
jest.mock('@/lib/supabase');

describe('BlogGenerator', () => {
  let generator: BlogGenerator;
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
    generator = new BlogGenerator();
  });

  describe('generateBlogPost', () => {
    const mockActivity = {
      commits: [
        { sha: '123', message: 'Add feature X', author: 'dev1', date: '2024-01-01', url: 'https://github.com/test/repo/commit/123' },
        { sha: '456', message: 'Fix bug Y', author: 'dev2', date: '2024-01-02', url: 'https://github.com/test/repo/commit/456' },
      ],
      pull_requests: [
        { number: 1, title: 'Feature X PR', merged_at: '2024-01-01', url: 'https://github.com/test/repo/pull/1' },
      ],
      issues: [
        { number: 1, title: 'Bug Y', closed_at: '2024-01-01', url: 'https://github.com/test/repo/issues/1' },
      ],
      releases: [
        { tag_name: 'v1.0.0', name: 'Version 1.0', published_at: '2024-01-01', url: 'https://github.com/test/repo/releases/v1.0.0' },
      ],
      contributors: ['dev1', 'dev2'],
      files_changed: ['src/feature.ts', 'src/bug-fix.ts'],
    };

    it('should generate a complete blog post', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'New Release: Version 1.0 with Feature X',
              content: '# Introduction\n\nWe are excited to announce...\n\n## Features\n\n- Feature X\n\n## Bug Fixes\n\n- Fixed bug Y',
              excerpt: 'Announcing version 1.0 with new features',
              seo_title: 'Version 1.0 Release | Product Name',
              seo_description: 'Learn about the new features in version 1.0',
              seo_keywords: ['release', 'feature', 'version 1.0'],
              code_snippets: [
                { language: 'typescript', code: 'const feature = new Feature();', explanation: 'Using the new feature' },
              ],
            }),
          },
        }],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const result = await generator.generateBlogPost('test-repo', mockActivity);

      expect(result.title).toBe('New Release: Version 1.0 with Feature X');
      expect(result.content).toContain('Feature X');
      expect(result.excerpt).toBeTruthy();
      expect(result.seoTitle).toBeTruthy();
      expect(result.seoDescription).toBeTruthy();
      expect(result.seoKeywords).toBeInstanceOf(Array);
      expect(result.codeSnippets).toBeInstanceOf(Array);
      expect(result.slug).toBe('new-release-version-1-0-with-feature-x');
    });

    it('should generate slug correctly', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Test Post: Special Ch@rs & Spaces!!!',
              content: 'Content',
              excerpt: 'Excerpt',
              seo_title: 'Title',
              seo_description: 'Desc',
              seo_keywords: [],
            }),
          },
        }],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const result = await generator.generateBlogPost('test-repo', mockActivity);

      expect(result.slug).toBe('test-post-special-ch-rs-spaces');
      expect(result.slug).not.toContain(' ');
      expect(result.slug).not.toContain('@');
      expect(result.slug).not.toMatch(/^-|-$/);
    });

    it('should throw error if no content generated', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: null,
          },
        }],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      await expect(generator.generateBlogPost('test-repo', mockActivity)).rejects.toThrow('No content generated');
    });

    it('should use correct OpenAI model', async () => {
      process.env.OPENAI_MODEL = 'gpt-4-turbo-preview';

      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Test',
              content: 'Content',
              excerpt: 'Excerpt',
              seo_title: 'Title',
              seo_description: 'Desc',
              seo_keywords: [],
            }),
          },
        }],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      await generator.generateBlogPost('test-repo', mockActivity);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4-turbo-preview',
        })
      );
    });

    it('should handle empty activity gracefully', async () => {
      const emptyActivity = {
        commits: [],
        pull_requests: [],
        issues: [],
        releases: [],
        contributors: [],
        files_changed: [],
      };

      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Maintenance Update',
              content: 'Minor updates',
              excerpt: 'Maintenance',
              seo_title: 'Update',
              seo_description: 'Minor updates',
              seo_keywords: [],
            }),
          },
        }],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const result = await generator.generateBlogPost('test-repo', emptyActivity);

      expect(result).toBeDefined();
      expect(result.title).toBe('Maintenance Update');
    });
  });
});
