import OpenAI from 'openai';
import { supabaseAdmin } from './supabase';
import type { ActivitySummary, BlogPost, CodeSnippet } from '@/types/database';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface BlogPostGeneration {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  codeSnippets: CodeSnippet[];
}

export class BlogGenerator {
  async generateBlogPost(
    repositoryName: string,
    activity: ActivitySummary
  ): Promise<BlogPostGeneration> {
    const prompt = this.buildPrompt(repositoryName, activity);

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a technical content writer who creates engaging blog posts about software development progress.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2500,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content generated');
    }

    const parsed = JSON.parse(content);
    return {
      title: parsed.title,
      slug: this.generateSlug(parsed.title),
      content: parsed.content,
      excerpt: parsed.excerpt,
      seoTitle: parsed.seo_title,
      seoDescription: parsed.seo_description,
      seoKeywords: parsed.seo_keywords,
      codeSnippets: parsed.code_snippets || [],
    };
  }

  private buildPrompt(repositoryName: string, activity: ActivitySummary): string {
    const commitMessages = activity.commits.slice(0, 5).map(c => c.message).join(', ');
    const prTitles = activity.pull_requests.slice(0, 3).map(pr => pr.title).join(', ');
    const issueTitles = activity.issues.slice(0, 3).map(i => i.title).join(', ');
    const releaseNames = activity.releases.map(r => r.tag_name).join(', ');
    const contributors = activity.contributors.join(', ');
    const filesChanged = activity.files_changed.slice(0, 10).join(', ');

    return `Generate a technical blog post about recent development activity in "${repositoryName}".
    
Activity: ${activity.commits.length} commits, ${activity.pull_requests.length} PRs merged, ${activity.issues.length} issues closed, ${activity.releases.length} releases.
Recent commits: ${commitMessages}
PRs: ${prTitles}
Issues: ${issueTitles}
Releases: ${releaseNames}
Contributors: ${contributors}
Files: ${filesChanged}

Return JSON with: title, content (markdown, 800-1200 words), excerpt, seo_title, seo_description, seo_keywords array, code_snippets array.`;
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

export async function generateAndSaveBlogPost(
  userId: string,
  repositoryId: string,
  activityId: string,
  repositoryName: string,
  activity: ActivitySummary
): Promise<string> {
  const generator = new BlogGenerator();
  const blogPost = await generator.generateBlogPost(repositoryName, activity);

  const { data, error } = await supabaseAdmin
    .from('blog_posts')
    .insert({
      user_id: userId,
      repository_id: repositoryId,
      activity_id: activityId,
      title: blogPost.title,
      slug: blogPost.slug,
      content: blogPost.content,
      excerpt: blogPost.excerpt,
      seo_title: blogPost.seoTitle,
      seo_description: blogPost.seoDescription,
      seo_keywords: blogPost.seoKeywords,
      code_snippets: blogPost.codeSnippets,
      status: 'draft',
    })
    .select()
    .single();

  if (error) throw error;
  return data.id;
}
