/**
 * Repository Analysis Service
 * Phase 3.2: Repository Analysis
 */
import { GitHubClient } from '@/lib/github/client';
import { OpenAI } from 'openai';
import type { RepositoryAnalysis } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface RepositoryScanResult {
  readme: string | null;
  packageJson: Record<string, any> | null;
  languages: Record<string, number>;
  analysis: RepositoryAnalysis;
}

export class RepositoryAnalyzer {
  private githubClient: GitHubClient;

  constructor(accessToken: string) {
    this.githubClient = new GitHubClient(accessToken);
  }

  /**
   * Scan repository for README, package.json, and languages
   */
  async scanRepository(owner: string, repo: string): Promise<RepositoryScanResult> {
    const [readme, packageJson, languages] = await Promise.all([
      this.githubClient.getRepositoryReadme(owner, repo),
      this.githubClient.getRepositoryManifest(owner, repo, 'package.json'),
      this.githubClient.getRepositoryLanguages(owner, repo),
    ]);

    // Generate analysis using AI
    const analysis = await this.analyzeRepository({
      readme,
      packageJson,
      languages,
      repoName: repo,
    });

    return {
      readme,
      packageJson,
      languages,
      analysis,
    };
  }

  /**
   * Analyze repository using AI to extract structured information
   */
  private async analyzeRepository(data: {
    readme: string | null;
    packageJson: Record<string, any> | null;
    languages: Record<string, number>;
    repoName: string;
  }): Promise<RepositoryAnalysis> {
    const prompt = this.buildAnalysisPrompt(data);

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a technical analyst specializing in software project analysis. ' +
              'Analyze the provided repository information and extract key insights about ' +
              'the project purpose, features, frameworks, and target audience. ' +
              'Return your analysis as a valid JSON object matching the specified schema.',
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
        throw new Error('No response from OpenAI');
      }

      const analysis = JSON.parse(result);

      // Validate and normalize the response
      return {
        primaryLanguages: analysis.primaryLanguages || this.extractPrimaryLanguages(data.languages),
        frameworks: analysis.frameworks || [],
        purpose: analysis.purpose || 'Software project',
        features: analysis.features || [],
        targetAudience: analysis.targetAudience || 'Developers',
      };
    } catch (error) {
      console.error('Error analyzing repository:', error);

      // Fallback analysis
      return this.getFallbackAnalysis(data);
    }
  }

  /**
   * Build the AI prompt for repository analysis
   */
  private buildAnalysisPrompt(data: {
    readme: string | null;
    packageJson: Record<string, any> | null;
    languages: Record<string, number>;
    repoName: string;
  }): string {
    let prompt = `Analyze the following GitHub repository:\n\n`;
    prompt += `Repository Name: ${data.repoName}\n\n`;

    if (data.readme) {
      prompt += `README Content:\n${data.readme.slice(0, 3000)}\n\n`;
    }

    if (data.packageJson) {
      prompt += `Package.json:\n${JSON.stringify(
        {
          name: data.packageJson.name,
          description: data.packageJson.description,
          dependencies: Object.keys(data.packageJson.dependencies || {}),
          devDependencies: Object.keys(data.packageJson.devDependencies || {}),
        },
        null,
        2
      )}\n\n`;
    }

    const languages = Object.keys(data.languages).join(', ');
    prompt += `Programming Languages: ${languages}\n\n`;

    prompt += `Please analyze this repository and provide a JSON response with the following structure:
{
  "primaryLanguages": ["array of main programming languages"],
  "frameworks": ["array of frameworks and libraries used"],
  "purpose": "concise description of what this project does",
  "features": ["array of key features"],
  "targetAudience": "description of who would use this project"
}`;

    return prompt;
  }

  /**
   * Extract primary languages from language statistics
   */
  private extractPrimaryLanguages(languages: Record<string, number>): string[] {
    const sorted = Object.entries(languages).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, 3).map(([lang]) => lang);
  }

  /**
   * Fallback analysis when AI fails
   */
  private getFallbackAnalysis(data: {
    readme: string | null;
    packageJson: Record<string, any> | null;
    languages: Record<string, number>;
    repoName: string;
  }): RepositoryAnalysis {
    const primaryLanguages = this.extractPrimaryLanguages(data.languages);
    const frameworks: string[] = [];

    // Extract frameworks from package.json
    if (data.packageJson?.dependencies) {
      const deps = Object.keys(data.packageJson.dependencies);
      if (deps.includes('react')) frameworks.push('React');
      if (deps.includes('next')) frameworks.push('Next.js');
      if (deps.includes('vue')) frameworks.push('Vue');
      if (deps.includes('express')) frameworks.push('Express');
      if (deps.includes('@nestjs/core')) frameworks.push('NestJS');
    }

    return {
      primaryLanguages,
      frameworks,
      purpose: data.packageJson?.description || 'Software project',
      features: [],
      targetAudience: 'Developers',
    };
  }
}
