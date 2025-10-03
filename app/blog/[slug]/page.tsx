import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export async function generateStaticParams() {
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug')
    .eq('status', 'published');

  return posts?.map((post) => ({ slug: post.slug })) || [];
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (!post) return { title: 'Post Not Found' };

  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt,
    keywords: post.seo_keywords?.join(', '),
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (!post) notFound();

  await supabase
    .from('blog_posts')
    .update({ views_count: post.views_count + 1 })
    .eq('id', post.id);

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
      
      <div className="flex items-center text-gray-600 mb-8">
        <time>{new Date(post.published_at!).toLocaleDateString()}</time>
        <span className="mx-2">•</span>
        <span>{post.views_count} views</span>
      </div>

      <div className="prose prose-lg max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({node, inline, className, children, ...props}) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>

      {post.code_snippets && post.code_snippets.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Code Examples</h2>
          {post.code_snippets.map((snippet: any, idx: number) => (
            <div key={idx} className="mb-6">
              {snippet.filename && (
                <p className="text-sm text-gray-600 mb-2">{snippet.filename}</p>
              )}
              {snippet.description && (
                <p className="text-sm mb-2">{snippet.description}</p>
              )}
              <SyntaxHighlighter language={snippet.language} style={vscDarkPlus}>
                {snippet.code}
              </SyntaxHighlighter>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
