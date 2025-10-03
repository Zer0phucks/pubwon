import { Octokit } from '@octokit/rest';
import { db } from './db';
import { githubIssues, repositories } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { ExtractedPainPoint } from './pain-point-analyzer';

export interface GitHubIssueData {
  title: string;
  body: string;
  labels: string[];
}

export interface CreatedIssue {
  number: number;
  id: string;
  url: string;
  title: string;
}

export class GitHubClient {
  private octokit: Octokit;

  constructor(accessToken?: string) {
    const token = accessToken || process.env.GITHUB_TOKEN;
    
    if (!token) {
      throw new Error('GitHub access token not configured');
    }

    this.octokit = new Octokit({
      auth: token,
    });
  }

  async createIssue(
    owner: string,
    repo: string,
    issueData: GitHubIssueData
  ): Promise<CreatedIssue> {
    try {
      const response = await this.octokit.issues.create({
        owner,
        repo,
        title: issueData.title,
        body: issueData.body,
        labels: issueData.labels,
      });

      return {
        number: response.data.number,
        id: response.data.id.toString(),
        url: response.data.html_url,
        title: response.data.title,
      };
    } catch (error) {
      console.error('Error creating GitHub issue:', error);
      throw error;
    }
  }

  async checkDuplicateIssue(
    owner: string,
    repo: string,
    title: string
  ): Promise<boolean> {
    try {
      const response = await this.octokit.search.issuesAndPullRequests({
        q: `repo:${owner}/${repo} is:issue "${title}"`,
      });

      return response.data.total_count > 0;
    } catch (error) {
      console.error('Error checking for duplicate issues:', error);
      return false;
    }
  }

  painPointToIssue(painPoint: ExtractedPainPoint): GitHubIssueData {
    const body = `
## Pain Point Description

${painPoint.description}

## Category

${painPoint.category}

## Severity

${painPoint.severity}

## Evidence from User Research

${painPoint.evidence.map(e => `- ${e}`).join('\n')}

---

*This issue was automatically generated from customer discovery research.*
*Source: Reddit analysis*
`;

    const labels = [
      'customer-discovery',
      `severity-${painPoint.severity}`,
      painPoint.category.toLowerCase().replace(/\s+/g, '-'),
    ];

    return {
      title: painPoint.title,
      body: body.trim(),
      labels,
    };
  }

  async createIssuesFromPainPoints(
    repositoryId: string,
    painPoints: ExtractedPainPoint[]
  ): Promise<CreatedIssue[]> {
    const repository = await db.query.repositories.findFirst({
      where: eq(repositories.id, repositoryId),
    });

    if (!repository) {
      throw new Error('Repository not found');
    }

    const [owner, repo] = repository.fullName.split('/');
    const createdIssues: CreatedIssue[] = [];

    console.log(`Creating ${painPoints.length} GitHub issues...`);

    for (const painPoint of painPoints) {
      try {
        const isDuplicate = await this.checkDuplicateIssue(
          owner,
          repo,
          painPoint.title
        );

        if (isDuplicate) {
          console.log(`Issue "${painPoint.title}" already exists, skipping`);
          continue;
        }

        const issueData = this.painPointToIssue(painPoint);
        const createdIssue = await this.createIssue(owner, repo, issueData);

        createdIssues.push(createdIssue);

        console.log(`Created issue #${createdIssue.number}: ${createdIssue.title}`);

        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error creating issue for "${painPoint.title}":`, error);
      }
    }

    return createdIssues;
  }

  async storeCreatedIssues(
    repositoryId: string,
    painPointId: string,
    issue: CreatedIssue
  ): Promise<void> {
    try {
      await db.insert(githubIssues).values({
        repositoryId,
        painPointId,
        githubIssueNumber: issue.number,
        githubIssueId: issue.id,
        title: issue.title,
        body: '',
        url: issue.url,
        state: 'open',
        labels: [],
      });
    } catch (error) {
      console.error('Error storing GitHub issue:', error);
    }
  }

  async bulkCreateIssues(
    repositoryId: string,
    painPointIds: string[]
  ): Promise<{ created: number; skipped: number; errors: number }> {
    const stats = { created: 0, skipped: 0, errors: 0 };

    for (const painPointId of painPointIds) {
      try {
        const painPoint = await db.query.painPoints.findFirst({
          where: eq(painPoints.id, painPointId),
        });

        if (!painPoint || painPoint.status !== 'approved') {
          stats.skipped++;
          continue;
        }

        const existing = await db.query.githubIssues.findFirst({
          where: eq(githubIssues.painPointId, painPointId),
        });

        if (existing) {
          stats.skipped++;
          continue;
        }

        const repository = await db.query.repositories.findFirst({
          where: eq(repositories.id, repositoryId),
        });

        if (!repository) {
          stats.errors++;
          continue;
        }

        const [owner, repo] = repository.fullName.split('/');

        const extractedPainPoint: ExtractedPainPoint = {
          title: painPoint.title,
          description: painPoint.description,
          category: painPoint.category || 'General',
          severity: painPoint.severity as any,
          evidence: [],
        };

        const issueData = this.painPointToIssue(extractedPainPoint);
        const createdIssue = await this.createIssue(owner, repo, issueData);

        await this.storeCreatedIssues(repositoryId, painPointId, createdIssue);

        stats.created++;

        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (error) {
        console.error(`Error creating issue for pain point ${painPointId}:`, error);
        stats.errors++;
      }
    }

    return stats;
  }

  async getRepositoryInfo(owner: string, repo: string) {
    try {
      const response = await this.octokit.repos.get({
        owner,
        repo,
      });

      return {
        id: response.data.id,
        name: response.data.name,
        fullName: response.data.full_name,
        description: response.data.description,
        url: response.data.html_url,
        language: response.data.language,
        stars: response.data.stargazers_count,
        forks: response.data.forks_count,
      };
    } catch (error) {
      console.error('Error fetching repository info:', error);
      throw error;
    }
  }

  async listUserRepositories(): Promise<any[]> {
    try {
      const response = await this.octokit.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100,
      });

      return response.data.map(repo => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        language: repo.language,
        private: repo.private,
      }));
    } catch (error) {
      console.error('Error listing repositories:', error);
      throw error;
    }
  }
}

export const createGitHubClient = (accessToken?: string) => new GitHubClient(accessToken);
