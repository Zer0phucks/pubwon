/**
 * Subreddit Identification Service
 * Phase 3.4: Subreddit Identification
 */
import { OpenAI } from 'openai';
import Snoowrap from 'snoowrap';
import type { ICPPersona, SubredditSuggestion } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export class SubredditFinder {
  private reddit: Snoowrap;

  constructor() {
    this.reddit = new Snoowrap({
      userAgent: process.env.REDDIT_USER_AGENT!,
      clientId: process.env.REDDIT_CLIENT_ID!,
      clientSecret: process.env.REDDIT_CLIENT_SECRET!,
      refreshToken: '', // Will use client credentials flow
    });
  }

  /**
   * Discover relevant subreddits based on ICP persona
   */
  async discoverSubreddits(persona: ICPPersona): Promise<SubredditSuggestion[]> {
    // First, use AI to generate subreddit suggestions
    const aiSuggestions = await this.generateSubredditSuggestions(persona);

    // Then validate and enrich these suggestions with real Reddit data
    const validatedSubreddits = await this.validateSubreddits(aiSuggestions);

    // Sort by relevance score
    return validatedSubreddits.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Use AI to generate subreddit suggestions
   */
  private async generateSubredditSuggestions(persona: ICPPersona): Promise<string[]> {
    const prompt = this.buildSubredditPrompt(persona);

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert in Reddit communities and online community discovery. ' +
              'Based on the ICP persona provided, suggest relevant subreddits where this audience is active. ' +
              'Focus on technical, professional, and interest-based communities. ' +
              'Return a JSON array of subreddit names (without r/ prefix).',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const result = completion.choices[0].message.content;
      if (!result) {
        return this.getFallbackSubreddits(persona);
      }

      const parsed = JSON.parse(result);
      return Array.isArray(parsed.subreddits) ? parsed.subreddits : this.getFallbackSubreddits(persona);
    } catch (error) {
      console.error('Error generating subreddit suggestions:', error);
      return this.getFallbackSubreddits(persona);
    }
  }

  /**
   * Build prompt for subreddit generation
   */
  private buildSubredditPrompt(persona: ICPPersona): string {
    let prompt = `Find relevant subreddits for the following ICP persona:\n\n`;
    prompt += `Persona: ${persona.name}\n\n`;

    prompt += `Demographics:\n`;
    if (persona.demographics.occupation) {
      prompt += `- Occupation: ${persona.demographics.occupation.join(', ')}\n`;
    }
    if (persona.demographics.experience) {
      prompt += `- Experience: ${persona.demographics.experience}\n`;
    }

    prompt += `\nGoals:\n${persona.goals.map((g) => `- ${g}`).join('\n')}\n`;
    prompt += `\nPain Points:\n${persona.painPoints.map((p) => `- ${p}`).join('\n')}\n`;

    if (persona.technicalSkills.length > 0) {
      prompt += `\nTechnical Skills: ${persona.technicalSkills.join(', ')}\n`;
    }

    prompt += `\nSuggest 10-15 active subreddits where this persona would be present. Include:
- Technical subreddits related to their skills
- Professional communities related to their occupation
- Problem/solution-focused communities related to their pain points
- Interest-based communities aligned with their goals

Return a JSON object with this structure:
{
  "subreddits": ["array of subreddit names without r/ prefix"]
}`;

    return prompt;
  }

  /**
   * Validate subreddits and fetch metadata from Reddit
   */
  private async validateSubreddits(subredditNames: string[]): Promise<SubredditSuggestion[]> {
    const results: SubredditSuggestion[] = [];

    for (const name of subredditNames) {
      try {
        const subreddit = await this.reddit.getSubreddit(name).fetch();

        // Only include subreddits with reasonable activity
        if (subreddit.subscribers && subreddit.subscribers > 1000) {
          results.push({
            name: subreddit.display_name.toLowerCase(),
            displayName: subreddit.display_name,
            description: subreddit.public_description || subreddit.description || '',
            subscribers: subreddit.subscribers || 0,
            relevanceScore: this.calculateRelevanceScore(subreddit.subscribers || 0),
            relevanceReason: 'AI-suggested based on persona analysis',
          });
        }
      } catch (error) {
        console.error(`Error validating subreddit ${name}:`, error);
        // Continue with other subreddits
      }

      // Rate limiting: wait between requests
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Calculate relevance score based on subreddit metrics
   */
  private calculateRelevanceScore(subscribers: number): number {
    // Score from 0-100 based on subscriber count
    // Sweet spot: 10k-500k subscribers
    if (subscribers < 1000) return 20;
    if (subscribers < 10000) return 50;
    if (subscribers < 50000) return 80;
    if (subscribers < 500000) return 100;
    if (subscribers < 1000000) return 85;
    return 70; // Very large subreddits can be less focused
  }

  /**
   * Search for subreddits by keyword
   */
  async searchSubreddits(query: string, limit: number = 10): Promise<SubredditSuggestion[]> {
    try {
      const results = await this.reddit.searchSubreddits({ query, limit });

      return results
        .filter((sr) => sr.subscribers && sr.subscribers > 1000)
        .map((sr) => ({
          name: sr.display_name.toLowerCase(),
          displayName: sr.display_name,
          description: sr.public_description || '',
          subscribers: sr.subscribers || 0,
          relevanceScore: this.calculateRelevanceScore(sr.subscribers || 0),
          relevanceReason: `Matched search: ${query}`,
        }));
    } catch (error) {
      console.error('Error searching subreddits:', error);
      return [];
    }
  }

  /**
   * Fallback subreddits based on persona
   */
  private getFallbackSubreddits(persona: ICPPersona): string[] {
    const fallbacks: string[] = ['programming', 'webdev', 'learnprogramming'];

    // Add language-specific subreddits
    persona.technicalSkills.forEach((skill) => {
      const lower = skill.toLowerCase();
      if (lower.includes('javascript')) fallbacks.push('javascript');
      if (lower.includes('python')) fallbacks.push('python');
      if (lower.includes('react')) fallbacks.push('reactjs');
      if (lower.includes('node')) fallbacks.push('node');
    });

    // Add occupation-based subreddits
    if (persona.demographics.occupation) {
      persona.demographics.occupation.forEach((occ) => {
        const lower = occ.toLowerCase();
        if (lower.includes('developer') || lower.includes('engineer')) {
          fallbacks.push('cscareerquestions');
        }
        if (lower.includes('startup')) fallbacks.push('startups');
      });
    }

    return [...new Set(fallbacks)]; // Remove duplicates
  }
}
