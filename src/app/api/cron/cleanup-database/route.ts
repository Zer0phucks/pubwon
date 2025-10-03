/**
 * Vercel Cron endpoint for database cleanup
 * Schedule: Weekly on Mondays at 4am UTC
 */

import { NextRequest, NextResponse } from 'next/server';
import { executeJob } from '@/lib/jobs/logger';
import { JOB_CONFIGS } from '@/lib/jobs/types';
import { cleanupDatabase } from '@/lib/jobs/database-cleanup';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const maxDuration = 180; // 3 minutes

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await executeJob(
      JOB_CONFIGS.DATABASE_CLEANUP,
      cleanupDatabase
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Database cleanup completed',
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
