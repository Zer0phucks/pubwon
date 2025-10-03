/**
 * Vercel Cron endpoint for weekly subreddit analysis
 * Schedule: Weekly on Sundays at 2am UTC
 */

import { NextRequest, NextResponse } from 'next/server';
import { executeJob } from '@/lib/jobs/logger';
import { JOB_CONFIGS } from '@/lib/jobs/types';
import { analyzeSubreddits } from '@/lib/jobs/subreddit-analyzer';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const maxDuration = 600; // 10 minutes

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await executeJob(
      JOB_CONFIGS.WEEKLY_SUBREDDIT_ANALYSIS,
      analyzeSubreddits
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Subreddit analysis completed',
        data: result.data,
        metadata: result.metadata,
        warnings: result.warnings,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
