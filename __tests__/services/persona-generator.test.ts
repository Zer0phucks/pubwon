/**
 * Tests for Persona Generator Service
 */
import { PersonaGenerator } from '@/lib/services/persona-generator';
import type { PersonaGenerationInput } from '@/types';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    name: 'Senior Full-Stack Developer',
                    demographics: {
                      ageRange: '28-42',
                      occupation: ['Senior Developer', 'Tech Lead', 'Engineering Manager'],
                      experience: 'Senior (5-10 years)',
                      location: 'Global',
                      companySize: 'Startup to Mid-size',
                    },
                    goals: [
                      'Build scalable customer discovery processes',
                      'Integrate development with customer feedback',
                    ],
                    painPoints: [
                      'Lack of customer insights during development',
                      'Manual process for tracking customer feedback',
                    ],
                    motivations: ['Build better products', 'Improve development efficiency'],
                    useCases: ['Automated customer research', 'GitHub integration for feedback'],
                    technicalSkills: ['TypeScript', 'React', 'Node.js'],
                    preferredPlatforms: ['GitHub', 'Reddit', 'Stack Overflow'],
                  }),
                },
              },
            ],
          }),
        },
      },
    })),
  };
});

describe('PersonaGenerator', () => {
  let generator: PersonaGenerator;

  beforeEach(() => {
    generator = new PersonaGenerator();
    jest.clearAllMocks();
  });

  describe('generatePersona', () => {
    it('should generate a complete persona', async () => {
      const input: PersonaGenerationInput = {
        repositoryAnalysis: {
          primaryLanguages: ['TypeScript', 'JavaScript'],
          frameworks: ['Next.js', 'React'],
          purpose: 'Customer discovery platform',
          features: ['GitHub integration', 'Reddit analysis'],
          targetAudience: 'Software developers',
        },
        repositoryName: 'test-repo',
        repositoryDescription: 'A test repository',
        topics: ['development', 'customer-discovery'],
      };

      const persona = await generator.generatePersona(input);

      expect(persona).toHaveProperty('name');
      expect(persona).toHaveProperty('demographics');
      expect(persona).toHaveProperty('goals');
      expect(persona).toHaveProperty('painPoints');
      expect(persona).toHaveProperty('motivations');
      expect(persona).toHaveProperty('useCases');
      expect(persona).toHaveProperty('technicalSkills');
      expect(persona).toHaveProperty('preferredPlatforms');

      expect(persona.name).toBeTruthy();
      expect(Array.isArray(persona.goals)).toBe(true);
      expect(Array.isArray(persona.painPoints)).toBe(true);
      expect(persona.isActive).toBe(true);
    });

    it('should include repository analysis in persona', async () => {
      const input: PersonaGenerationInput = {
        repositoryAnalysis: {
          primaryLanguages: ['Python', 'Go'],
          frameworks: ['Django', 'Flask'],
          purpose: 'API development platform',
          features: ['REST API', 'GraphQL'],
          targetAudience: 'Backend developers',
        },
        repositoryName: 'api-platform',
        topics: ['api', 'backend'],
      };

      const persona = await generator.generatePersona(input);

      expect(persona.technicalSkills).toBeDefined();
      expect(Array.isArray(persona.technicalSkills)).toBe(true);
    });

    it('should handle generation errors with fallback', async () => {
      // Override mock to simulate error
      const mockOpenAI = require('openai').OpenAI;
      mockOpenAI.mockImplementationOnce(() => ({
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('API Error')),
          },
        },
      }));

      const input: PersonaGenerationInput = {
        repositoryAnalysis: {
          primaryLanguages: ['JavaScript'],
          frameworks: ['Express'],
          purpose: 'Web server',
          features: [],
          targetAudience: 'Developers',
        },
        repositoryName: 'test-server',
        topics: [],
      };

      const persona = await generator.generatePersona(input);

      // Should return fallback persona
      expect(persona).toBeDefined();
      expect(persona.name).toContain('JavaScript Developer');
      expect(persona.isActive).toBe(true);
    });
  });

  describe('updatePersona', () => {
    it('should merge updates into existing persona', async () => {
      const currentPersona = {
        name: 'Developer',
        goals: ['Build apps'],
      };

      const updates = {
        goals: ['Build scalable apps', 'Learn new tech'],
        painPoints: ['Time constraints'],
      };

      const updated = await generator.updatePersona(currentPersona, updates);

      expect(updated.name).toBe('Developer');
      expect(updated.goals).toEqual(['Build scalable apps', 'Learn new tech']);
      expect(updated.painPoints).toEqual(['Time constraints']);
      expect(updated.updatedAt).toBeDefined();
    });
  });
});
