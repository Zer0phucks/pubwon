/**
 * API routes for repository management
 * GET: Fetch user's GitHub repositories
 * POST: Save selected repository and trigger analysis
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decrypt } from '@/lib/encryption';
import { GitHubClient } from '@/lib/github/client';
import { RepositoryAnalyzer } from '@/lib/services/repository-analyzer';
import type { ApiResponse, GitHubRepository, Repository } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/repositories
 * Fetch user's GitHub repositories
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<GitHubRepository[]>>> {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's GitHub access token
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('github_access_token')
      .eq('id', userId)
      .single();

    if (userError || !user?.github_access_token) {
      return NextResponse.json(
        { success: false, error: 'GitHub not connected' },
        { status: 400 }
      );
    }

    // Decrypt access token
    const accessToken = decrypt(user.github_access_token);

    // Fetch repositories from GitHub
    const githubClient = new GitHubClient(accessToken);
    const repositories = await githubClient.getUserRepositories();

    return NextResponse.json({
      success: true,
      data: repositories,
    });
  } catch (error) {
    console.error('Error fetching repositories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch repositories' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/repositories
 * Save selected repository and trigger analysis
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Repository>>> {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { githubId, name, fullName, description, htmlUrl, language, stars, forks, isPrivate, defaultBranch, topics } = body;

    // Get user's GitHub access token
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('github_access_token')
      .eq('id', userId)
      .single();

    if (userError || !user?.github_access_token) {
      return NextResponse.json(
        { success: false, error: 'GitHub not connected' },
        { status: 400 }
      );
    }

    // Decrypt access token
    const accessToken = decrypt(user.github_access_token);

    // Analyze repository
    const analyzer = new RepositoryAnalyzer(accessToken);
    const [owner, repo] = fullName.split('/');
    const scanResult = await analyzer.scanRepository(owner, repo);

    // Save repository to database
    const { data: repository, error: repoError } = await supabase
      .from('repositories')
      .insert({
        user_id: userId,
        github_id: githubId.toString(),
        name,
        full_name: fullName,
        description,
        html_url: htmlUrl,
        language,
        stars: stars || 0,
        forks: forks || 0,
        is_private: isPrivate,
        default_branch: defaultBranch,
        topics: topics || [],
        readme: scanResult.readme,
        package_json: scanResult.packageJson,
        analysis: scanResult.analysis,
      })
      .select()
      .single();

    if (repoError) {
      throw repoError;
    }

    return NextResponse.json({
      success: true,
      data: repository,
      message: 'Repository saved and analyzed successfully',
    });
  } catch (error) {
    console.error('Error saving repository:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save repository' },
      { status: 500 }
    );
  }
}
