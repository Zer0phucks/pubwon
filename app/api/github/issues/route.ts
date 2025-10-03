import { NextRequest, NextResponse } from 'next/server';
import { createGitHubClient } from '@/lib/github-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repositoryId, painPointIds, accessToken } = body;

    if (!repositoryId || !painPointIds || !Array.isArray(painPointIds)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const githubClient = createGitHubClient(accessToken);
    const stats = await githubClient.bulkCreateIssues(repositoryId, painPointIds);

    return NextResponse.json({
      success: true,
      stats,
      message: `Created ${stats.created} issues, skipped ${stats.skipped}, errors ${stats.errors}`,
    });
  } catch (error) {
    console.error('Error creating GitHub issues:', error);
    return NextResponse.json(
      { error: 'Failed to create GitHub issues' },
      { status: 500 }
    );
  }
}
