import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export const revalidate = 3600; // Revalidate every hour

export default async function BlogPage() {
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Blog</h1>
      
      <div className="space-y-8">
        {posts?.map((post) => (
          <article key={post.id} className="border-b pb-8">
            <Link href={`/blog/${post.slug}`} className="group">
              <h2 className="text-2xl font-semibold mb-2 group-hover:text-blue-600 transition">
                {post.title}
              </h2>
            </Link>
            
            <p className="text-gray-600 mb-4">{post.excerpt}</p>
            
            <div className="flex items-center text-sm text-gray-500">
              <time>
                {formatDistanceToNow(new Date(post.published_at!), { addSuffix: true })}
              </time>
              <span className="mx-2">•</span>
              <span>{post.views_count} views</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
