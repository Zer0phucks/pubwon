/**
 * GitHub API Client
 * Phase 1.4: External APIs Setup
 *
 * Handles GitHub OAuth, repository access, issue creation, and webhooks
 */

import { Octokit } from '@octokit/rest';
import crypto from 'crypto';

// Initialize GitHub client
export function createGitHubClient(accessToken?: string) {
  return new Octokit({
    auth: accessToken || process.env.GITHUB_ACCESS_TOKEN,
    userAgent: 'PubWon/1.0.0',
  });
}

/**
 * Exchange OAuth code for access token
 */
export async function exchangeOAuthCode(code: string): Promise<{
  access_token: string;
  token_type: string;
  scope: string;
}> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange OAuth code');
  }

  return response.json();
}

/**
 * Get authenticated user information
 */
export async function getAuthenticatedUser(accessToken: string) {
  const octokit = createGitHubClient(accessToken);
  const { data } = await octokit.users.getAuthenticated();
  return data;
}

/**
 * List user's repositories
 */
export async function listUserRepositories(
  accessToken: string,
  options: {
    visibility?: 'all' | 'public' | 'private';
    affiliation?: 'owner' | 'collaborator' | 'organization_member';
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    per_page?: number;
  } = {}
) {
  const octokit = createGitHubClient(accessToken);

  const { data } = await octokit.repos.listForAuthenticatedUser({
    visibility: options.visibility || 'all',
    affiliation: options.affiliation || 'owner',
    sort: options.sort || 'updated',
    per_page: options.per_page || 100,
  });

  return data;
}

/**
 * Get repository details
 */
export async function getRepository(
  owner: string,
  repo: string,
  accessToken?: string
) {
  const octokit = createGitHubClient(accessToken);
  const { data } = await octokit.repos.get({ owner, repo });
  return data;
}

/**
 * Get repository README
 */
export async function getRepositoryReadme(
  owner: string,
  repo: string,
  accessToken?: string
): Promise<string | null> {
  const octokit = createGitHubClient(accessToken);

  try {
    const { data } = await octokit.repos.getReadme({ owner, repo });

    // Decode base64 content
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return content;
  } catch (error: any) {
    if (error.status === 404) {
      return null; // README not found
    }
    throw error;
  }
}

/**
 * Get repository contents
 */
export async function getRepositoryContents(
  owner: string,
  repo: string,
  path: string = '',
  accessToken?: string
) {
  const octokit = createGitHubClient(accessToken);
  const { data } = await octokit.repos.getContent({ owner, repo, path });
  return data;
}

/**
 * Get repository languages
 */
export async function getRepositoryLanguages(
  owner: string,
  repo: string,
  accessToken?: string
) {
  const octokit = createGitHubClient(accessToken);
  const { data } = await octokit.repos.listLanguages({ owner, repo });
  return data;
}

/**
 * Create an issue in a repository
 */
export async function createIssue(
  owner: string,
  repo: string,
  options: {
    title: string;
    body: string;
    labels?: string[];
    assignees?: string[];
    milestone?: number;
  },
  accessToken?: string
) {
  const octokit = createGitHubClient(accessToken);

  const { data } = await octokit.issues.create({
    owner,
    repo,
    title: options.title,
    body: options.body,
    labels: options.labels,
    assignees: options.assignees,
    milestone: options.milestone,
  });

  return data;
}

/**
 * List repository issues
 */
export async function listIssues(
  owner: string,
  repo: string,
  options: {
    state?: 'open' | 'closed' | 'all';
    labels?: string[];
    sort?: 'created' | 'updated' | 'comments';
    since?: string;
    per_page?: number;
  } = {},
  accessToken?: string
) {
  const octokit = createGitHubClient(accessToken);

  const { data } = await octokit.issues.listForRepo({
    owner,
    repo,
    state: options.state || 'all',
    labels: options.labels?.join(','),
    sort: options.sort || 'created',
    since: options.since,
    per_page: options.per_page || 30,
  });

  return data;
}

/**
 * Get repository commits
 */
export async function getCommits(
  owner: string,
  repo: string,
  options: {
    since?: string;
    until?: string;
    per_page?: number;
    sha?: string;
  } = {},
  accessToken?: string
) {
  const octokit = createGitHubClient(accessToken);

  const { data } = await octokit.repos.listCommits({
    owner,
    repo,
    since: options.since,
    until: options.until,
    per_page: options.per_page || 30,
    sha: options.sha,
  });

  return data;
}

/**
 * Get repository pull requests
 */
export async function getPullRequests(
  owner: string,
  repo: string,
  options: {
    state?: 'open' | 'closed' | 'all';
    sort?: 'created' | 'updated' | 'popularity';
    per_page?: number;
  } = {},
  accessToken?: string
) {
  const octokit = createGitHubClient(accessToken);

  const { data } = await octokit.pulls.list({
    owner,
    repo,
    state: options.state || 'all',
    sort: options.sort || 'created',
    per_page: options.per_page || 30,
  });

  return data;
}

/**
 * Get repository releases
 */
export async function getReleases(
  owner: string,
  repo: string,
  options: {
    per_page?: number;
  } = {},
  accessToken?: string
) {
  const octokit = createGitHubClient(accessToken);

  const { data } = await octokit.repos.listReleases({
    owner,
    repo,
    per_page: options.per_page || 10,
  });

  return data;
}

/**
 * Create a repository webhook
 */
export async function createWebhook(
  owner: string,
  repo: string,
  options: {
    url: string;
    events?: string[];
    active?: boolean;
  },
  accessToken?: string
) {
  const octokit = createGitHubClient(accessToken);

  const { data } = await octokit.repos.createWebhook({
    owner,
    repo,
    config: {
      url: options.url,
      content_type: 'json',
      secret: process.env.GITHUB_WEBHOOK_SECRET,
    },
    events: options.events || ['push', 'pull_request', 'issues', 'release'],
    active: options.active !== false,
  });

  return data;
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string = process.env.GITHUB_WEBHOOK_SECRET!
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

/**
 * Parse repository owner and name from URL or string
 */
export function parseRepositoryIdentifier(identifier: string): {
  owner: string;
  repo: string;
} {
  // Handle URL format: https://github.com/owner/repo
  const urlMatch = identifier.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2].replace(/\.git$/, '') };
  }

  // Handle owner/repo format
  const parts = identifier.split('/');
  if (parts.length === 2) {
    return { owner: parts[0], repo: parts[1] };
  }

  throw new Error('Invalid repository identifier format');
}

/**
 * Search repositories
 */
export async function searchRepositories(
  query: string,
  options: {
    sort?: 'stars' | 'forks' | 'updated';
    order?: 'asc' | 'desc';
    per_page?: number;
  } = {}
) {
  const octokit = createGitHubClient();

  const { data } = await octokit.search.repos({
    q: query,
    sort: options.sort,
    order: options.order,
    per_page: options.per_page || 30,
  });

  return data;
}

/**
 * Get rate limit status
 */
export async function getRateLimit(accessToken?: string) {
  const octokit = createGitHubClient(accessToken);
  const { data } = await octokit.rateLimit.get();
  return data;
}

/**
 * Types
 */
export type GitHubRepository = Awaited<ReturnType<typeof getRepository>>;
export type GitHubIssue = Awaited<ReturnType<typeof createIssue>>;
export type GitHubCommit = Awaited<ReturnType<typeof getCommits>>[number];
export type GitHubPullRequest = Awaited<ReturnType<typeof getPullRequests>>[number];
export type GitHubRelease = Awaited<ReturnType<typeof getReleases>>[number];
