/**
 * AI API Client
 * Phase 1.4: External APIs Setup
 *
 * Unified interface for OpenAI and Anthropic APIs
 */

import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
});

/**
 * AI Provider type
 */
export type AIProvider = 'openai' | 'anthropic';

/**
 * AI Model configuration
 */
export const AI_MODELS = {
  openai: {
    'gpt-4o-mini': {
      name: 'GPT-4o Mini',
      contextWindow: 128000,
      inputCostPer1M: 0.15,
      outputCostPer1M: 0.60,
    },
    'gpt-4o': {
      name: 'GPT-4o',
      contextWindow: 128000,
      inputCostPer1M: 2.5,
      outputCostPer1M: 10.0,
    },
  },
  anthropic: {
    'claude-3-5-sonnet-20241022': {
      name: 'Claude 3.5 Sonnet',
      contextWindow: 200000,
      inputCostPer1M: 3.0,
      outputCostPer1M: 15.0,
    },
    'claude-3-opus-20240229': {
      name: 'Claude 3 Opus',
      contextWindow: 200000,
      inputCostPer1M: 15.0,
      outputCostPer1M: 75.0,
    },
  },
} as const;

/**
 * Generate chat completion using OpenAI
 */
export async function generateChatCompletion(
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    stream?: boolean;
  } = {}
) {
  const response = await openai.chat.completions.create({
    model: options.model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens,
    top_p: options.topP ?? 1,
    stream: options.stream ?? false,
  });

  if (options.stream) {
    return response as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
  }

  const completion = response as OpenAI.Chat.Completions.ChatCompletion;
  return {
    content: completion.choices[0].message.content,
    usage: completion.usage,
    model: completion.model,
    finishReason: completion.choices[0].finish_reason,
  };
}

/**
 * Generate structured output with JSON mode
 */
export async function generateStructuredOutput<T = any>(
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>,
  options: {
    model?: string;
    temperature?: number;
    schema?: object;
  } = {}
): Promise<T> {
  const response = await openai.chat.completions.create({
    model: options.model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages,
    temperature: options.temperature ?? 0.7,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No content in AI response');
  }

  return JSON.parse(content) as T;
}

/**
 * Generate embeddings for text
 */
export async function generateEmbeddings(
  texts: string[],
  options: {
    model?: string;
  } = {}
) {
  const response = await openai.embeddings.create({
    model: options.model || 'text-embedding-3-small',
    input: texts,
  });

  return response.data.map(item => item.embedding);
}

/**
 * Extract pain points from Reddit discussions
 */
export async function extractPainPoints(
  discussions: Array<{
    title: string;
    content: string;
    comments: string[];
  }>,
  icpPersona: {
    demographics: string;
    goals: string;
    challenges: string;
  }
): Promise<
  Array<{
    painPoint: string;
    category: string;
    severity: 'low' | 'medium' | 'high';
    frequency: number;
    evidence: string[];
  }>
> {
  const systemPrompt = `You are an expert at analyzing customer discussions and extracting pain points.

ICP Persona Context:
- Demographics: ${icpPersona.demographics}
- Goals: ${icpPersona.goals}
- Challenges: ${icpPersona.challenges}

Your task is to analyze Reddit discussions and extract genuine pain points that align with this persona.

For each pain point:
1. Identify the core problem or frustration
2. Categorize it (e.g., "workflow", "integration", "performance", "learning curve", "cost")
3. Rate severity (low/medium/high) based on impact on user goals
4. Count frequency mentions across discussions
5. Provide evidence quotes from the discussions

Return a JSON array of pain points.`;

  const userPrompt = `Analyze these discussions and extract pain points:

${discussions
  .map(
    (d, i) => `
Discussion ${i + 1}:
Title: ${d.title}
Content: ${d.content}
Top Comments:
${d.comments.slice(0, 5).join('\n')}
`
  )
  .join('\n---\n')}`;

  return await generateStructuredOutput(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { temperature: 0.5 }
  );
}

/**
 * Generate ICP persona from repository analysis
 */
export async function generateICPPersona(repositoryAnalysis: {
  name: string;
  description: string;
  readme: string;
  languages: Record<string, number>;
  topics: string[];
}): Promise<{
  demographics: string;
  psychographics: string;
  goals: string[];
  challenges: string[];
  painPoints: string[];
  useCases: string[];
}> {
  const systemPrompt = `You are an expert at creating Ideal Customer Profiles (ICP) from software project analysis.

Analyze the repository and create a detailed ICP persona representing the primary target user.

Consider:
- Who would use this project?
- What problems does it solve?
- What technical level is required?
- What are their goals and motivations?
- What challenges do they face?

Return a JSON object with the ICP persona structure.`;

  const userPrompt = `Analyze this repository and create an ICP persona:

Repository: ${repositoryAnalysis.name}
Description: ${repositoryAnalysis.description}

README Content:
${repositoryAnalysis.readme.slice(0, 2000)}

Primary Languages:
${Object.entries(repositoryAnalysis.languages)
  .slice(0, 5)
  .map(([lang, bytes]) => `- ${lang}: ${bytes} bytes`)
  .join('\n')}

Topics: ${repositoryAnalysis.topics.join(', ')}`;

  return await generateStructuredOutput(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { temperature: 0.7 }
  );
}

/**
 * Generate blog post from repository activity
 */
export async function generateBlogPost(activity: {
  commits: Array<{ message: string; author: string; date: string }>;
  pullRequests: Array<{ title: string; description: string }>;
  issues: Array<{ title: string; status: string }>;
  releases: Array<{ version: string; notes: string }>;
  repositoryName: string;
  repositoryDescription: string;
}): Promise<{
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tags: string[];
  seoMetadata: {
    title: string;
    description: string;
    keywords: string[];
  };
}> {
  const systemPrompt = `You are a technical content writer creating engaging blog posts about software development progress.

Write a blog post that:
1. Has an attention-grabbing title
2. Includes a brief excerpt/summary
3. Explains what was built and why it matters
4. Highlights key technical achievements
5. Includes code examples or technical details where relevant
6. Ends with future roadmap or call-to-action
7. Is SEO-optimized with relevant keywords

Tone: Technical but accessible, enthusiastic but not salesy.
Length: 800-1200 words.
Format: Markdown.

Return a JSON object with the blog post structure.`;

  const userPrompt = `Create a blog post about recent development activity:

Repository: ${activity.repositoryName}
Description: ${activity.repositoryDescription}

Recent Commits (${activity.commits.length}):
${activity.commits
  .slice(0, 10)
  .map(c => `- ${c.message} (${c.author})`)
  .join('\n')}

Pull Requests (${activity.pullRequests.length}):
${activity.pullRequests
  .slice(0, 5)
  .map(pr => `- ${pr.title}`)
  .join('\n')}

Recent Issues:
${activity.issues
  .slice(0, 5)
  .map(i => `- ${i.title} (${i.status})`)
  .join('\n')}

${
  activity.releases.length > 0
    ? `Latest Release:
Version: ${activity.releases[0].version}
Notes: ${activity.releases[0].notes}`
    : ''
}`;

  return await generateStructuredOutput(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { temperature: 0.8, model: 'gpt-4o' }
  );
}

/**
 * Generate newsletter from blog post
 */
export async function generateNewsletter(
  blogPost: {
    title: string;
    content: string;
    excerpt: string;
  },
  additionalContext?: {
    previousNewsletters?: string[];
    audienceSize?: number;
  }
): Promise<{
  subject: string;
  preheader: string;
  htmlContent: string;
  plainTextContent: string;
}> {
  const systemPrompt = `You are an email marketing expert creating engaging newsletters.

Create a newsletter email that:
1. Has a compelling subject line (under 50 characters)
2. Includes a preheader text (under 100 characters)
3. Contains HTML-formatted content optimized for email
4. Includes a plain text version
5. Has clear call-to-action
6. Is mobile-friendly
7. Follows email best practices

Tone: Friendly, informative, not too salesy.
Structure: Brief intro → Main content → CTA → Footer

Return a JSON object with the newsletter structure.`;

  const userPrompt = `Create a newsletter based on this blog post:

Title: ${blogPost.title}
Excerpt: ${blogPost.excerpt}

Full Content:
${blogPost.content.slice(0, 3000)}

${additionalContext?.audienceSize ? `Audience Size: ~${additionalContext.audienceSize} subscribers` : ''}`;

  return await generateStructuredOutput(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { temperature: 0.7 }
  );
}

/**
 * Suggest relevant subreddits based on ICP persona
 */
export async function suggestSubreddits(icpPersona: {
  demographics: string;
  goals: string[];
  challenges: string[];
  interests?: string[];
}): Promise<
  Array<{
    subreddit: string;
    relevanceScore: number;
    reasoning: string;
  }>
> {
  const systemPrompt = `You are an expert at identifying relevant Reddit communities for target audiences.

Analyze the ICP persona and suggest 10-15 subreddits where this audience is likely active.

For each subreddit:
1. Provide the subreddit name (without r/ prefix)
2. Rate relevance (0-1 scale)
3. Explain why this community is relevant

Focus on:
- Active communities with engaged members
- Mix of niche and broader communities
- Communities aligned with user goals and challenges

Return a JSON array of subreddit suggestions, sorted by relevance score (highest first).`;

  const userPrompt = `Suggest relevant subreddits for this ICP persona:

Demographics: ${icpPersona.demographics}

Goals:
${icpPersona.goals.map(g => `- ${g}`).join('\n')}

Challenges:
${icpPersona.challenges.map(c => `- ${c}`).join('\n')}

${icpPersona.interests ? `Interests: ${icpPersona.interests.join(', ')}` : ''}`;

  return await generateStructuredOutput(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { temperature: 0.6 }
  );
}

/**
 * Generate GitHub issue from pain point
 */
export async function generateGitHubIssue(painPoint: {
  painPoint: string;
  category: string;
  evidence: string[];
}): Promise<{
  title: string;
  body: string;
  labels: string[];
}> {
  const systemPrompt = `You are a product manager creating GitHub issues from customer pain points.

Transform the pain point into a well-structured GitHub issue:
1. Clear, action-oriented title
2. Detailed description with context
3. User story format when applicable
4. Acceptance criteria
5. Relevant labels

Return a JSON object with title, body (markdown), and labels.`;

  const userPrompt = `Create a GitHub issue for this pain point:

Pain Point: ${painPoint.painPoint}
Category: ${painPoint.category}

Evidence from users:
${painPoint.evidence.map(e => `- "${e}"`).join('\n')}`;

  return await generateStructuredOutput(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { temperature: 0.6 }
  );
}

/**
 * Calculate cost for AI operation
 */
export function calculateAICost(
  provider: AIProvider,
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const modelConfig = AI_MODELS[provider][model as keyof typeof AI_MODELS[typeof provider]];
  if (!modelConfig) return 0;

  const inputCost = (inputTokens / 1_000_000) * modelConfig.inputCostPer1M;
  const outputCost = (outputTokens / 1_000_000) * modelConfig.outputCostPer1M;

  return inputCost + outputCost;
}

/**
 * Types
 */
export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type AIResponse = {
  content: string | null;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
  finishReason: string | null;
};
