/**
 * API routes for subreddit management
 * POST: Discover subreddits based on persona
 * PUT: Save selected subreddits
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SubredditFinder } from '@/lib/services/subreddit-finder';
import type { ApiResponse, SubredditSuggestion, Subreddit } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/subreddits
 * Discover subreddits based on persona
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<SubredditSuggestion[]>>> {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { personaId } = body;

    if (!personaId) {
      return NextResponse.json(
        { success: false, error: 'Persona ID is required' },
        { status: 400 }
      );
    }

    // Fetch persona
    const { data: persona, error: personaError } = await supabase
      .from('icp_personas')
      .select('*')
      .eq('id', personaId)
      .eq('user_id', userId)
      .single();

    if (personaError || !persona) {
      return NextResponse.json({ success: false, error: 'Persona not found' }, { status: 404 });
    }

    // Discover subreddits
    const finder = new SubredditFinder();
    const suggestions = await finder.discoverSubreddits(persona);

    return NextResponse.json({
      success: true,
      data: suggestions,
      message: `Found ${suggestions.length} relevant subreddits`,
    });
  } catch (error) {
    console.error('Error discovering subreddits:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to discover subreddits' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/subreddits
 * Save selected subreddits
 */
export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse<Subreddit[]>>> {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { personaId, subreddits } = body;

    if (!personaId || !Array.isArray(subreddits)) {
      return NextResponse.json(
        { success: false, error: 'Persona ID and subreddits array are required' },
        { status: 400 }
      );
    }

    // Prepare subreddit records
    const subredditRecords = subreddits.map((sr: SubredditSuggestion) => ({
      icp_persona_id: personaId,
      user_id: userId,
      name: sr.name,
      display_name: sr.displayName,
      description: sr.description,
      subscribers: sr.subscribers,
      relevance_score: sr.relevanceScore,
      is_monitored: true,
      added_manually: false,
    }));

    // Save subreddits to database
    const { data: savedSubreddits, error: saveError } = await supabase
      .from('subreddits')
      .insert(subredditRecords)
      .select();

    if (saveError) {
      throw saveError;
    }

    return NextResponse.json({
      success: true,
      data: savedSubreddits,
      message: `Saved ${savedSubreddits.length} subreddits`,
    });
  } catch (error) {
    console.error('Error saving subreddits:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save subreddits' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/subreddits/search
 * Search for subreddits by keyword
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<SubredditSuggestion[]>>> {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ success: false, error: 'Search query is required' }, { status: 400 });
    }

    const finder = new SubredditFinder();
    const results = await finder.searchSubreddits(query);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error searching subreddits:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search subreddits' },
      { status: 500 }
    );
  }
}
