/**
 * Daily repository scanner job
 * Monitors GitHub repositories for changes and triggers content generation
 */

import { createClient } from '@/lib/supabase/server';
import { createGitHubClient } from '@/lib/github/client';
import { decryptToken } from '@/lib/encryption';
import { JobResult } from './types';

interface RepoActivity {
  repositoryId: string;
  commits: number;
  pullRequests: number;
  closedIssues: number;
  releases: number;
  hasSignificantChanges: boolean;
  lastChecked: Date;
}

export async function scanRepositories(): Promise<JobResult<RepoActivity[]>> {
  const supabase = await createClient();
  const activities: RepoActivity[] = [];
  const warnings: string[] = [];

  try {
    // Get all repositories with their users
    const { data: repos, error: repoError } = await supabase
      .from('repositories')
      .select(`
        id,
        github_id,
        full_name,
        default_branch,
        updated_at,
        users!inner (
          id,
          github_access_token
        )
      `);

    if (repoError) throw repoError;
    if (!repos || repos.length === 0) {
      return {
        success: true,
        data: [],
        warnings: ['No repositories to scan'],
      };
    }

    // Check each repository for activity
    for (const repo of repos) {
      try {
        const token = decryptToken(repo.users.github_access_token);
        const github = createGitHubClient(token);

        const [owner, repoName] = repo.full_name.split('/');
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        // Get commits since last check
        const { data: commits } = await github.repos.listCommits({
          owner,
          repo: repoName,
          since: repo.updated_at || yesterday.toISOString(),
          per_page: 100,
        });

        // Get merged PRs since last check
        const { data: prs } = await github.pulls.list({
          owner,
          repo: repoName,
          state: 'closed',
          sort: 'updated',
          direction: 'desc',
          per_page: 50,
        });

        const mergedPRs = prs.filter(pr =>
          pr.merged_at && new Date(pr.merged_at) > new Date(repo.updated_at || yesterday)
        );

        // Get closed issues since last check
        const { data: issues } = await github.issues.listForRepo({
          owner,
          repo: repoName,
          state: 'closed',
          since: repo.updated_at || yesterday.toISOString(),
          per_page: 50,
        });

        // Get releases since last check
        const { data: releases } = await github.repos.listReleases({
          owner,
          repo: repoName,
          per_page: 10,
        });

        const recentReleases = releases.filter(release =>
          new Date(release.published_at || release.created_at) > new Date(repo.updated_at || yesterday)
        );

        // Determine if changes are significant enough for content generation
        const hasSignificantChanges =
          (commits?.length || 0) >= 5 ||
          (mergedPRs?.length || 0) >= 2 ||
          (recentReleases?.length || 0) >= 1;

        const activity: RepoActivity = {
          repositoryId: repo.id,
          commits: commits?.length || 0,
          pullRequests: mergedPRs?.length || 0,
          closedIssues: issues?.length || 0,
          releases: recentReleases?.length || 0,
          hasSignificantChanges,
          lastChecked: new Date(),
        };

        activities.push(activity);

        // Update repository last checked timestamp
        await supabase
          .from('repositories')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', repo.id);

        // Create analytics event if significant changes
        if (hasSignificantChanges) {
          await supabase
            .from('analytics_events')
            .insert({
              user_id: repo.users.id,
              event_type: 'repository_activity_detected',
              event_data: activity,
              resource_id: repo.id,
              resource_type: 'repository',
            });
        }

      } catch (error) {
        warnings.push(`Failed to scan repository ${repo.full_name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        continue;
      }
    }

    return {
      success: true,
      data: activities,
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata: {
        totalRepos: repos.length,
        scannedRepos: activities.length,
        reposWithActivity: activities.filter(a => a.hasSignificantChanges).length,
      },
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
