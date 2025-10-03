import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const rss = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>PubWon Blog</title>
    <link>${baseUrl}/blog</link>
    <description>Latest updates</description>
    ${posts?.map(p => `<item><title>${p.title}</title></item>`).join('') || ''}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: { 'Content-Type': 'application/xml' },
  });
}