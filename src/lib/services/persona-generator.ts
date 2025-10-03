/**
 * ICP Persona Generation Service
 * Phase 3.3: ICP Persona Generation
 */
import { OpenAI } from 'openai';
import type { RepositoryAnalysis, PersonaGenerationInput, ICPPersona } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export class PersonaGenerator {
  /**
   * Generate ICP persona based on repository analysis
   */
  async generatePersona(input: PersonaGenerationInput): Promise<Omit<ICPPersona, 'id' | 'repositoryId' | 'userId' | 'createdAt' | 'updatedAt'>> {
    const prompt = this.buildPersonaPrompt(input);

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert in creating Ideal Customer Profile (ICP) personas for software products. ' +
              'Based on the repository analysis provided, create a detailed persona representing the target user. ' +
              'Focus on demographics, goals, pain points, motivations, use cases, and technical skills. ' +
              'Return your analysis as a valid JSON object matching the specified schema.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' },
      });

      const result = completion.choices[0].message.content;
      if (!result) {
        throw new Error('No response from OpenAI');
      }

      const persona = JSON.parse(result);

      // Validate and normalize the response
      return {
        name: persona.name || 'Primary User Persona',
        demographics: {
          ageRange: persona.demographics?.ageRange,
          occupation: Array.isArray(persona.demographics?.occupation)
            ? persona.demographics.occupation
            : [],
          experience: persona.demographics?.experience,
          location: persona.demographics?.location,
          companySize: persona.demographics?.companySize,
        },
        goals: Array.isArray(persona.goals) ? persona.goals : [],
        painPoints: Array.isArray(persona.painPoints) ? persona.painPoints : [],
        motivations: Array.isArray(persona.motivations) ? persona.motivations : [],
        useCases: Array.isArray(persona.useCases) ? persona.useCases : [],
        technicalSkills: Array.isArray(persona.technicalSkills) ? persona.technicalSkills : [],
        preferredPlatforms: Array.isArray(persona.preferredPlatforms)
          ? persona.preferredPlatforms
          : [],
        isActive: true,
      };
    } catch (error) {
      console.error('Error generating persona:', error);
      return this.getFallbackPersona(input);
    }
  }

  /**
   * Build the AI prompt for persona generation
   */
  private buildPersonaPrompt(input: PersonaGenerationInput): string {
    let prompt = `Generate an Ideal Customer Profile (ICP) persona for the following software project:\n\n`;
    prompt += `Project Name: ${input.repositoryName}\n`;

    if (input.repositoryDescription) {
      prompt += `Description: ${input.repositoryDescription}\n`;
    }

    prompt += `\nRepository Analysis:\n`;
    prompt += `- Primary Languages: ${input.repositoryAnalysis.primaryLanguages.join(', ')}\n`;
    prompt += `- Frameworks: ${input.repositoryAnalysis.frameworks.join(', ')}\n`;
    prompt += `- Purpose: ${input.repositoryAnalysis.purpose}\n`;

    if (input.repositoryAnalysis.features.length > 0) {
      prompt += `- Features: ${input.repositoryAnalysis.features.join(', ')}\n`;
    }

    prompt += `- Target Audience: ${input.repositoryAnalysis.targetAudience}\n`;

    if (input.topics.length > 0) {
      prompt += `- Topics: ${input.topics.join(', ')}\n`;
    }

    prompt += `\nCreate a detailed ICP persona with the following JSON structure:
{
  "name": "descriptive persona name (e.g., 'Senior Full-Stack Developer')",
  "demographics": {
    "ageRange": "age range (e.g., '25-40')",
    "occupation": ["array of job titles"],
    "experience": "experience level (e.g., 'Senior', '3-5 years')",
    "location": "typical location or 'Global'",
    "companySize": "typical company size (e.g., 'Startup', 'Enterprise')"
  },
  "goals": ["array of what this persona wants to achieve"],
  "painPoints": ["array of problems and frustrations they face"],
  "motivations": ["array of what drives them to seek solutions"],
  "useCases": ["array of specific scenarios where they'd use this project"],
  "technicalSkills": ["array of relevant technical skills"],
  "preferredPlatforms": ["array of platforms they use (GitHub, Stack Overflow, Reddit, etc.)"]
}

Make the persona realistic, specific, and actionable for customer discovery.`;

    return prompt;
  }

  /**
   * Fallback persona when AI fails
   */
  private getFallbackPersona(
    input: PersonaGenerationInput
  ): Omit<ICPPersona, 'id' | 'repositoryId' | 'userId' | 'createdAt' | 'updatedAt'> {
    const primaryLang = input.repositoryAnalysis.primaryLanguages[0] || 'Software';

    return {
      name: `${primaryLang} Developer`,
      demographics: {
        ageRange: '25-45',
        occupation: ['Software Developer', 'Software Engineer'],
        experience: 'Intermediate to Senior',
        location: 'Global',
        companySize: 'Startup to Mid-size',
      },
      goals: ['Build efficient software', 'Learn new technologies', 'Solve technical problems'],
      painPoints: [
        'Lack of good documentation',
        'Complex setup processes',
        'Limited time for learning',
      ],
      motivations: ['Career growth', 'Technical excellence', 'Community contribution'],
      useCases: [input.repositoryAnalysis.purpose],
      technicalSkills: input.repositoryAnalysis.primaryLanguages,
      preferredPlatforms: ['GitHub', 'Stack Overflow', 'Reddit', 'Twitter'],
      isActive: true,
    };
  }

  /**
   * Update persona based on user feedback
   */
  async updatePersona(
    currentPersona: Partial<ICPPersona>,
    updates: Partial<ICPPersona>
  ): Promise<Partial<ICPPersona>> {
    return {
      ...currentPersona,
      ...updates,
      updatedAt: new Date(),
    };
  }
}
