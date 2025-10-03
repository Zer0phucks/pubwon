import { NextResponse } from 'next/server';
import { generateAndSaveBlogPost } from '@/lib/blog-generator';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: activities, error } = await supabaseAdmin
      .from('repository_activity')
      .select('*')
      .eq('is_significant', true)
      .is('processed', null)
      .order('activity_date', { ascending: false })
      .limit(10);

    if (error) throw error;
    if (!activities || activities.length === 0) {
      return NextResponse.json({ message: 'No significant activity to process' });
    }

    const results = [];
    for (const activity of activities) {
      try {
        const blogPostId = await generateAndSaveBlogPost(
          activity.user_id,
          activity.repository_id,
          activity.id,
          'Repository',
          activity.activity_summary
        );

        await supabaseAdmin
          .from('repository_activity')
          .update({ processed: true })
          .eq('id', activity.id);

        results.push({ activity_id: activity.id, blog_post_id: blogPostId, status: 'success' });
      } catch (error) {
        results.push({ activity_id: activity.id, status: 'error', error: String(error) });
      }
    }

    return NextResponse.json({ message: 'Content generation completed', results });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500 });
  }
}
