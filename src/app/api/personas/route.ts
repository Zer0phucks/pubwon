/**
 * API routes for ICP persona management
 * POST: Generate ICP persona from repository analysis
 * PUT: Update existing persona
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PersonaGenerator } from '@/lib/services/persona-generator';
import type { ApiResponse, ICPPersona, PersonaGenerationInput } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/personas
 * Generate ICP persona from repository analysis
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<ICPPersona>>> {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { repositoryId } = body;

    if (!repositoryId) {
      return NextResponse.json(
        { success: false, error: 'Repository ID is required' },
        { status: 400 }
      );
    }

    // Fetch repository with analysis
    const { data: repository, error: repoError } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', repositoryId)
      .eq('user_id', userId)
      .single();

    if (repoError || !repository) {
      return NextResponse.json(
        { success: false, error: 'Repository not found' },
        { status: 404 }
      );
    }

    if (!repository.analysis) {
      return NextResponse.json(
        { success: false, error: 'Repository analysis not available' },
        { status: 400 }
      );
    }

    // Generate persona
    const generator = new PersonaGenerator();
    const personaData = await generator.generatePersona({
      repositoryAnalysis: repository.analysis,
      repositoryName: repository.name,
      repositoryDescription: repository.description || undefined,
      topics: repository.topics || [],
    });

    // Save persona to database
    const { data: persona, error: personaError } = await supabase
      .from('icp_personas')
      .insert({
        repository_id: repositoryId,
        user_id: userId,
        name: personaData.name,
        demographics: personaData.demographics,
        goals: personaData.goals,
        pain_points: personaData.painPoints,
        motivations: personaData.motivations,
        use_cases: personaData.useCases,
        technical_skills: personaData.technicalSkills,
        preferred_platforms: personaData.preferredPlatforms,
        is_active: true,
      })
      .select()
      .single();

    if (personaError) {
      throw personaError;
    }

    return NextResponse.json({
      success: true,
      data: persona,
      message: 'Persona generated successfully',
    });
  } catch (error) {
    console.error('Error generating persona:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate persona' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/personas
 * Update existing persona
 */
export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse<ICPPersona>>> {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { personaId, updates } = body;

    if (!personaId || !updates) {
      return NextResponse.json(
        { success: false, error: 'Persona ID and updates are required' },
        { status: 400 }
      );
    }

    // Update persona
    const { data: persona, error: updateError } = await supabase
      .from('icp_personas')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', personaId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      data: persona,
      message: 'Persona updated successfully',
    });
  } catch (error) {
    console.error('Error updating persona:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update persona' },
      { status: 500 }
    );
  }
}
