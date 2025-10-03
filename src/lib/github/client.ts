/**
 * GitHub API client for repository and user operations
 */
import { Octokit } from '@octokit/rest';
import type { GitHubRepository, GitHubUser } from '@/types';

export class GitHubClient {
  private octokit: Octokit;

  constructor(accessToken: string) {
    this.octokit = new Octokit({
      auth: accessToken,
    });
  }

  /**
   * Get authenticated user's information
   */
  async getUser(): Promise<GitHubUser> {
    const { data } = await this.octokit.users.getAuthenticated();
    return {
      login: data.login,
      id: data.id,
      avatar_url: data.avatar_url,
      name: data.name || '',
      email: data.email || '',
    };
  }

  /**
   * Get user's repositories
   */
  async getUserRepositories(): Promise<GitHubRepository[]> {
    const { data } = await this.octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
    });

    return data.map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      html_url: repo.html_url,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      private: repo.private,
      default_branch: repo.default_branch,
      topics: repo.topics || [],
    }));
  }

  /**
   * Get repository README
   */
  async getRepositoryReadme(owner: string, repo: string): Promise<string | null> {
    try {
      const { data } = await this.octokit.repos.getReadme({
        owner,
        repo,
      });

      // Decode base64 content
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return content;
    } catch (error) {
      console.error('Error fetching README:', error);
      return null;
    }
  }

  /**
   * Get repository package.json or other manifest files
   */
  async getRepositoryManifest(
    owner: string,
    repo: string,
    path: string = 'package.json'
  ): Promise<Record<string, any> | null> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
      });

      if ('content' in data) {
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        return JSON.parse(content);
      }

      return null;
    } catch (error) {
      console.error(`Error fetching ${path}:`, error);
      return null;
    }
  }

  /**
   * Get repository languages
   */
  async getRepositoryLanguages(owner: string, repo: string): Promise<Record<string, number>> {
    try {
      const { data } = await this.octokit.repos.listLanguages({
        owner,
        repo,
      });

      return data;
    } catch (error) {
      console.error('Error fetching languages:', error);
      return {};
    }
  }

  /**
   * Create an issue in a repository
   */
  async createIssue(
    owner: string,
    repo: string,
    title: string,
    body: string,
    labels?: string[]
  ): Promise<{
    number: number;
    id: number;
    html_url: string;
  }> {
    const { data } = await this.octokit.issues.create({
      owner,
      repo,
      title,
      body,
      labels,
    });

    return {
      number: data.number,
      id: data.id,
      html_url: data.html_url,
    };
  }
}
