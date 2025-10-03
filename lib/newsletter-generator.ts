import OpenAI from 'openai';
import { supabaseAdmin } from './supabase';
import type { BlogPost } from '@/types/database';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface NewsletterGeneration {
  subjectLine: string;
  previewText: string;
  htmlContent: string;
  textContent: string;
}

export class NewsletterGenerator {
  async generateNewsletter(blogPost: BlogPost, repositoryName: string): Promise<NewsletterGeneration> {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an email marketing expert. Create engaging newsletters from blog posts.',
        },
        {
          role: 'user',
          content: `Create a newsletter from this blog post:
Title: ${blogPost.title}
Content: ${blogPost.content}
Excerpt: ${blogPost.excerpt}

Return JSON with: subject_line (compelling, 40-60 chars), preview_text (120 chars), html_content (email-friendly HTML), text_content (plain text version).`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const parsed = JSON.parse(response.choices[0].message.content!);
    return {
      subjectLine: parsed.subject_line,
      previewText: parsed.preview_text,
      htmlContent: this.wrapInEmailTemplate(parsed.html_content, blogPost.title),
      textContent: parsed.text_content,
    };
  }

  private wrapInEmailTemplate(content: string, title: string): string {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}h1{color:#2563eb}a{color:#2563eb}pre{background:#f3f4f6;padding:12px;border-radius:4px;overflow-x:auto}</style></head><body><h1>${title}</h1>${content}<hr><p style="font-size:12px;color:#6b7280">You received this because you subscribed. <a href="{{UNSUBSCRIBE_URL}}">Unsubscribe</a></p></body></html>`;
  }
}

export async function generateAndSaveNewsletter(
  userId: string,
  blogPostId: string,
  blogPost: BlogPost,
  repositoryName: string
): Promise<string> {
  const generator = new NewsletterGenerator();
  const newsletter = await generator.generateNewsletter(blogPost, repositoryName);

  const { data, error } = await supabaseAdmin
    .from('newsletters')
    .insert({
      user_id: userId,
      blog_post_id: blogPostId,
      subject_line: newsletter.subjectLine,
      preview_text: newsletter.previewText,
      html_content: newsletter.htmlContent,
      text_content: newsletter.textContent,
      status: 'draft',
    })
    .select()
    .single();

  if (error) throw error;
  return data.id;
}
