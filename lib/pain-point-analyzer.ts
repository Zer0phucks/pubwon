import OpenAI from 'openai';
import { ScrapedDiscussion } from './reddit-scraper';
import { db } from './db';
import { painPoints, redditDiscussions } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export interface ExtractedPainPoint {
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidence: string[];
  sourceDiscussionId?: string;
}

export interface PainPointAnalysis {
  painPoints: ExtractedPainPoint[];
  summary: string;
  themes: string[];
}

export class PainPointAnalyzer {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async analyzeDiscussion(
    discussion: ScrapedDiscussion,
    icpPersona: any
  ): Promise<ExtractedPainPoint[]> {
    const prompt = this.buildAnalysisPrompt(discussion, icpPersona);

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing customer discussions and extracting pain points. You identify problems, frustrations, and unmet needs that people express in online discussions.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      return this.validateAndNormalizePainPoints(result.painPoints || []);
    } catch (error) {
      console.error('Error analyzing discussion:', error);
      throw error;
    }
  }

  private buildAnalysisPrompt(
    discussion: ScrapedDiscussion,
    icpPersona: any
  ): string {
    const commentsText = discussion.comments
      .slice(0, 20)
      .map(c => `- ${c.body}`)
      .join('\n');

    const personaJson = JSON.stringify(icpPersona, null, 2);

    return `
Analyze the following Reddit discussion and extract pain points relevant to this ICP persona:

**ICP Persona:**
${personaJson}

**Reddit Post:**
Title: ${discussion.post.title}
Content: ${discussion.post.selftext}
Score: ${discussion.post.score}
Comments: ${discussion.post.num_comments}

**Top Comments:**
${commentsText}

**Task:**
Extract all pain points, problems, frustrations, and unmet needs mentioned in this discussion.
Focus on issues that align with the ICP persona's goals and challenges.

For each pain point, provide:
1. A clear, concise title (max 80 characters)
2. A detailed description (2-3 sentences)
3. A category (e.g., "Performance", "Usability", "Documentation", "Integration", "Cost")
4. Severity level: "low", "medium", "high", or "critical"
5. Evidence: Direct quotes from the discussion that support this pain point

Return the results as JSON with this structure:
{
  "painPoints": [
    {
      "title": "string",
      "description": "string",
      "category": "string",
      "severity": "low" | "medium" | "high" | "critical",
      "evidence": ["quote1", "quote2"]
    }
  ]
}

Only include genuine pain points. Ignore positive comments or general discussion.
`;
  }

  private validateAndNormalizePainPoints(
    painPoints: any[]
  ): ExtractedPainPoint[] {
    return painPoints
      .filter(pp => pp.title && pp.description && pp.category && pp.severity)
      .map(pp => ({
        title: pp.title.substring(0, 200),
        description: pp.description,
        category: pp.category,
        severity: ['low', 'medium', 'high', 'critical'].includes(pp.severity)
          ? pp.severity
          : 'medium',
        evidence: Array.isArray(pp.evidence) ? pp.evidence.slice(0, 5) : [],
      }));
  }

  async analyzeBatch(
    discussions: ScrapedDiscussion[],
    icpPersona: any
  ): Promise<PainPointAnalysis> {
    console.log(`Analyzing ${discussions.length} discussions...`);

    const allPainPoints: ExtractedPainPoint[] = [];
    const categories = new Set<string>();

    for (const discussion of discussions) {
      try {
        const painPoints = await this.analyzeDiscussion(discussion, icpPersona);
        
        allPainPoints.push(
          ...painPoints.map(pp => ({
            ...pp,
            sourceDiscussionId: discussion.post.id,
          }))
        );

        painPoints.forEach(pp => categories.add(pp.category));

        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error analyzing discussion ${discussion.post.id}:`, error);
      }
    }

    const groupedPainPoints = this.groupSimilarPainPoints(allPainPoints);
    const rankedPainPoints = this.rankPainPoints(groupedPainPoints);

    return {
      painPoints: rankedPainPoints,
      summary: `Extracted ${rankedPainPoints.length} pain points from ${discussions.length} discussions`,
      themes: Array.from(categories),
    };
  }

  private groupSimilarPainPoints(
    painPoints: ExtractedPainPoint[]
  ): ExtractedPainPoint[] {
    const grouped = new Map<string, ExtractedPainPoint>();

    for (const pp of painPoints) {
      const existing = grouped.get(pp.title);
      
      if (existing) {
        existing.evidence = [
          ...new Set([...existing.evidence, ...pp.evidence]),
        ].slice(0, 10);
        
        const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
        if (severityOrder[pp.severity] > severityOrder[existing.severity]) {
          existing.severity = pp.severity;
        }
      } else {
        grouped.set(pp.title, { ...pp });
      }
    }

    return Array.from(grouped.values());
  }

  private rankPainPoints(painPoints: ExtractedPainPoint[]): ExtractedPainPoint[] {
    const severityWeight = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    return painPoints
      .map(pp => ({
        ...pp,
        score:
          severityWeight[pp.severity] * 10 +
          pp.evidence.length * 5,
      }))
      .sort((a, b) => b.score - a.score)
      .map(({ score, ...pp }) => pp);
  }

  async storePainPoints(
    icpPersonaId: string,
    painPoints: ExtractedPainPoint[]
  ): Promise<void> {
    console.log(`Storing ${painPoints.length} pain points...`);

    for (const pp of painPoints) {
      try {
        let redditDiscussionId: string | null = null;
        
        if (pp.sourceDiscussionId) {
          const discussion = await db.query.redditDiscussions.findFirst({
            where: eq(redditDiscussions.redditPostId, pp.sourceDiscussionId),
          });
          
          if (discussion) {
            redditDiscussionId = discussion.id;
          }
        }

        const existing = await db.query.painPoints.findFirst({
          where: and(
            eq(painPoints.icpPersonaId, icpPersonaId),
            eq(painPoints.title, pp.title)
          ),
        });

        if (!existing) {
          await db.insert(painPoints).values({
            icpPersonaId,
            redditDiscussionId,
            title: pp.title,
            description: pp.description,
            category: pp.category,
            severity: pp.severity,
            status: 'pending',
          });
        } else {
          console.log(`Pain point "${pp.title}" already exists, skipping`);
        }
      } catch (error) {
        console.error(`Error storing pain point "${pp.title}":`, error);
      }
    }
  }

  async categorizePainPoints(painPoints: ExtractedPainPoint[]): Promise<Map<string, ExtractedPainPoint[]>> {
    const categorized = new Map<string, ExtractedPainPoint[]>();

    for (const pp of painPoints) {
      if (!categorized.has(pp.category)) {
        categorized.set(pp.category, []);
      }
      categorized.get(pp.category)!.push(pp);
    }

    return categorized;
  }
}

export const painPointAnalyzer = new PainPointAnalyzer();
