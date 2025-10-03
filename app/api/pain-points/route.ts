import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { painPoints } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const icpPersonaId = searchParams.get('icpPersonaId');
    const status = searchParams.get('status');

    let query = db.query.painPoints;
    let conditions = [];

    if (icpPersonaId) {
      conditions.push(eq(painPoints.icpPersonaId, icpPersonaId));
    }

    if (status) {
      conditions.push(eq(painPoints.status, status));
    }

    const results = await query.findMany({
      where: conditions.length > 0 ? conditions[0] : undefined,
      orderBy: (painPoints, { desc }) => [desc(painPoints.createdAt)],
    });

    return NextResponse.json({ painPoints: results });
  } catch (error) {
    console.error('Error fetching pain points:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pain points' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    await db
      .update(painPoints)
      .set({
        status,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(painPoints.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating pain point:', error);
    return NextResponse.json(
      { error: 'Failed to update pain point' },
      { status: 500 }
    );
  }
}
