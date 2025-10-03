/**
 * GitHub webhook handler
 * Handles push, PR, and issue events
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyGitHubSignature } from '@/lib/webhooks/verify';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256') || '';
    const event = request.headers.get('x-github-event') || '';

    // Verify webhook signature
    const secret = process.env.GITHUB_WEBHOOK_SECRET || '';
    if (!verifyGitHubSignature(body, signature, secret)) {
      console.error('Invalid GitHub webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body);
    const supabase = await createClient();

    // Handle different event types
    switch (event) {
      case 'push':
        await handlePushEvent(payload, supabase);
        break;

      case 'pull_request':
        await handlePullRequestEvent(payload, supabase);
        break;

      case 'issues':
        await handleIssueEvent(payload, supabase);
        break;

      case 'release':
        await handleReleaseEvent(payload, supabase);
        break;

      default:
        console.log(`Unhandled GitHub event: ${event}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('GitHub webhook error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

async function handlePushEvent(payload: any, supabase: any) {
  const repoFullName = payload.repository.full_name;
  const commits = payload.commits || [];

  // Find repository in database
  const { data: repo } = await supabase
    .from('repositories')
    .select('id, user_id')
    .eq('full_name', repoFullName)
    .single();

  if (!repo) return;

  // Create analytics event for push
  await supabase
    .from('analytics_events')
    .insert({
      user_id: repo.user_id,
      event_type: 'github_push',
      event_data: {
        repository: repoFullName,
        branch: payload.ref?.replace('refs/heads/', ''),
        commits: commits.length,
        author: payload.pusher?.name,
      },
      resource_id: repo.id,
      resource_type: 'repository',
    });

  // Update repository updated_at
  await supabase
    .from('repositories')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', repo.id);
}

async function handlePullRequestEvent(payload: any, supabase: any) {
  const repoFullName = payload.repository.full_name;
  const action = payload.action;
  const pr = payload.pull_request;

  const { data: repo } = await supabase
    .from('repositories')
    .select('id, user_id')
    .eq('full_name', repoFullName)
    .single();

  if (!repo) return;

  // Only track merged PRs
  if (action === 'closed' && pr.merged) {
    await supabase
      .from('analytics_events')
      .insert({
        user_id: repo.user_id,
        event_type: 'github_pr_merged',
        event_data: {
          repository: repoFullName,
          prNumber: pr.number,
          title: pr.title,
          author: pr.user?.login,
          mergedBy: pr.merged_by?.login,
        },
        resource_id: repo.id,
        resource_type: 'repository',
      });
  }
}

async function handleIssueEvent(payload: any, supabase: any) {
  const repoFullName = payload.repository.full_name;
  const action = payload.action;
  const issue = payload.issue;

  const { data: repo } = await supabase
    .from('repositories')
    .select('id, user_id')
    .eq('full_name', repoFullName)
    .single();

  if (!repo) return;

  // Track issue closures
  if (action === 'closed') {
    // Update github_issues table if exists
    await supabase
      .from('github_issues')
      .update({ state: 'closed' })
      .eq('repository_id', repo.id)
      .eq('github_issue_number', issue.number);

    await supabase
      .from('analytics_events')
      .insert({
        user_id: repo.user_id,
        event_type: 'github_issue_closed',
        event_data: {
          repository: repoFullName,
          issueNumber: issue.number,
          title: issue.title,
          closedBy: issue.closed_by?.login,
        },
        resource_id: repo.id,
        resource_type: 'repository',
      });
  }
}

async function handleReleaseEvent(payload: any, supabase: any) {
  const repoFullName = payload.repository.full_name;
  const action = payload.action;
  const release = payload.release;

  if (action !== 'published') return;

  const { data: repo } = await supabase
    .from('repositories')
    .select('id, user_id')
    .eq('full_name', repoFullName)
    .single();

  if (!repo) return;

  await supabase
    .from('analytics_events')
    .insert({
      user_id: repo.user_id,
      event_type: 'github_release_published',
      event_data: {
        repository: repoFullName,
        tagName: release.tag_name,
        name: release.name,
        prerelease: release.prerelease,
      },
      resource_id: repo.id,
      resource_type: 'repository',
    });

  // Update repository to trigger content generation
  await supabase
    .from('repositories')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', repo.id);
}
