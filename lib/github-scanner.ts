import { Octokit } from '@octokit/rest';
import { supabaseAdmin } from './supabase';
import type { ActivitySummary, GitHubCommit, GitHubPullRequest, GitHubIssue, GitHubRelease } from '@/types/database';

export class GitHubScanner {
  private octokit: Octokit;

  constructor(accessToken: string) {
    this.octokit = new Octokit({ auth: accessToken });
  }

  async scanRepository(owner: string, repo: string, since: Date): Promise<ActivitySummary> {
    const sinceISO = since.toISOString();

    // Fetch commits
    const commits = await this.fetchCommits(owner, repo, sinceISO);
    
    // Fetch merged pull requests
    const pullRequests = await this.fetchMergedPullRequests(owner, repo, sinceISO);
    
    // Fetch closed issues
    const issues = await this.fetchClosedIssues(owner, repo, sinceISO);
    
    // Fetch releases
    const releases = await this.fetchReleases(owner, repo, sinceISO);

    // Extract contributors
    const contributors = [...new Set(commits.map(c => c.author))];
    
    // Extract changed files
    const filesChanged = await this.fetchChangedFiles(owner, repo, commits.map(c => c.sha));

    return {
      commits,
      pull_requests: pullRequests,
      issues,
      releases,
      contributors,
      files_changed: filesChanged,
    };
  }

  private async fetchCommits(owner: string, repo: string, since: string): Promise<GitHubCommit[]> {
    try {
      const { data } = await this.octokit.repos.listCommits({
        owner,
        repo,
        since,
        per_page: 100,
      });

      return data.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author?.name || 'Unknown',
        date: commit.commit.author?.date || new Date().toISOString(),
        url: commit.html_url,
      }));
    } catch (error) {
      console.error('Error fetching commits:', error);
      return [];
    }
  }

  private async fetchMergedPullRequests(owner: string, repo: string, since: string): Promise<GitHubPullRequest[]> {
    try {
      const { data } = await this.octokit.pulls.list({
        owner,
        repo,
        state: 'closed',
        sort: 'updated',
        direction: 'desc',
        per_page: 100,
      });

      const sinceDate = new Date(since);
      const mergedPRs = data.filter(pr => 
        pr.merged_at && 
        new Date(pr.merged_at) >= sinceDate
      );

      return mergedPRs.map(pr => ({
        number: pr.number,
        title: pr.title,
        merged_at: pr.merged_at!,
        url: pr.html_url,
      }));
    } catch (error) {
      console.error('Error fetching pull requests:', error);
      return [];
    }
  }

  private async fetchClosedIssues(owner: string, repo: string, since: string): Promise<GitHubIssue[]> {
    try {
      const { data } = await this.octokit.issues.listForRepo({
        owner,
        repo,
        state: 'closed',
        since,
        per_page: 100,
      });

      // Filter out pull requests (they're also returned by issues API)
      const issues = data.filter(issue => !issue.pull_request);

      return issues.map(issue => ({
        number: issue.number,
        title: issue.title,
        closed_at: issue.closed_at!,
        url: issue.html_url,
      }));
    } catch (error) {
      console.error('Error fetching issues:', error);
      return [];
    }
  }

  private async fetchReleases(owner: string, repo: string, since: string): Promise<GitHubRelease[]> {
    try {
      const { data } = await this.octokit.repos.listReleases({
        owner,
        repo,
        per_page: 100,
      });

      const sinceDate = new Date(since);
      const recentReleases = data.filter(release => 
        new Date(release.published_at!) >= sinceDate
      );

      return recentReleases.map(release => ({
        tag_name: release.tag_name,
        name: release.name || release.tag_name,
        published_at: release.published_at!,
        url: release.html_url,
      }));
    } catch (error) {
      console.error('Error fetching releases:', error);
      return [];
    }
  }

  private async fetchChangedFiles(owner: string, repo: string, shas: string[]): Promise<string[]> {
    try {
      const filesSet = new Set<string>();
      
      // Fetch files for each commit (limit to first 20 commits to avoid rate limits)
      for (const sha of shas.slice(0, 20)) {
        const { data } = await this.octokit.repos.getCommit({
          owner,
          repo,
          ref: sha,
        });

        data.files?.forEach(file => filesSet.add(file.filename));
      }

      return Array.from(filesSet);
    } catch (error) {
      console.error('Error fetching changed files:', error);
      return [];
    }
  }

  static isSignificantActivity(summary: ActivitySummary): boolean {
    // Determine if activity is significant enough to generate content
    const significanceScore = 
      (summary.commits.length * 1) +
      (summary.pull_requests.length * 5) +
      (summary.issues.length * 3) +
      (summary.releases.length * 20);

    // Threshold: 10 points = significant
    return significanceScore >= 10;
  }
}

export async function scanRepositoryActivity(
  userId: string,
  repositoryId: string,
  owner: string,
  repo: string,
  accessToken: string
): Promise<void> {
  const scanner = new GitHubScanner(accessToken);
  
  // Get the last scan date (default to 24 hours ago)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const activity = await scanner.scanRepository(owner, repo, yesterday);
  
  const isSignificant = GitHubScanner.isSignificantActivity(activity);

  // Store activity in database
  await supabaseAdmin
    .from('repository_activity')
    .insert({
      user_id: userId,
      repository_id: repositoryId,
      activity_date: new Date().toISOString().split('T')[0],
      commits_count: activity.commits.length,
      prs_merged_count: activity.pull_requests.length,
      issues_closed_count: activity.issues.length,
      releases_count: activity.releases.length,
      activity_summary: activity,
      is_significant: isSignificant,
    });
}
