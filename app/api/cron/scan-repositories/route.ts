import { NextResponse } from 'next/server';
import { scanRepositoryActivity } from '@/lib/github-scanner';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'edge';

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch all active repositories with their owners
    const { data: repositories, error } = await supabaseAdmin
      .from('repositories')
      .select('id, user_id, owner, name, github_access_token')
      .eq('is_active', true);

    if (error) throw error;

    if (!repositories || repositories.length === 0) {
      return NextResponse.json({ message: 'No active repositories to scan' });
    }

    const results = [];

    for (const repo of repositories) {
      try {
        await scanRepositoryActivity(
          repo.user_id,
          repo.id,
          repo.owner,
          repo.name,
          repo.github_access_token
        );
        
        results.push({
          repository: `${repo.owner}/${repo.name}`,
          status: 'success',
        });
      } catch (error) {
        console.error(`Error scanning ${repo.owner}/${repo.name}:`, error);
        results.push({
          repository: `${repo.owner}/${repo.name}`,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      message: 'Repository scan completed',
      scanned: repositories.length,
      results,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
