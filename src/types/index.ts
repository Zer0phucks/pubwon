/**
 * Core type definitions for the application
 */

export interface User {
  id: string;
  email: string;
  githubUsername?: string;
  githubAccessToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Repository {
  id: string;
  userId: string;
  githubId: string;
  name: string;
  fullName: string;
  description?: string;
  htmlUrl: string;
  language?: string;
  stars: number;
  forks: number;
  isPrivate: boolean;
  defaultBranch: string;
  topics: string[];
  readme?: string;
  packageJson?: Record<string, any>;
  analysis?: RepositoryAnalysis;
  createdAt: Date;
  updatedAt: Date;
}

export interface RepositoryAnalysis {
  primaryLanguages: string[];
  frameworks: string[];
  purpose: string;
  features: string[];
  targetAudience: string;
}

export interface ICPPersona {
  id: string;
  repositoryId: string;
  userId: string;
  name: string;
  demographics: {
    ageRange?: string;
    occupation?: string[];
    experience?: string;
    location?: string;
    companySize?: string;
  };
  goals: string[];
  painPoints: string[];
  motivations: string[];
  useCases: string[];
  technicalSkills: string[];
  preferredPlatforms: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subreddit {
  id: string;
  icpPersonaId: string;
  userId: string;
  name: string;
  displayName: string;
  description?: string;
  subscribers: number;
  activeUsers: number;
  relevanceScore: number;
  isMonitored: boolean;
  addedManually: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PainPoint {
  id: string;
  subredditId: string;
  icpPersonaId: string;
  userId: string;
  title: string;
  description: string;
  category?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  frequency: number;
  sourceUrl?: string;
  sourcePostId?: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GitHubIssue {
  id: string;
  repositoryId: string;
  painPointId?: string;
  userId: string;
  githubIssueNumber: number;
  githubIssueId: string;
  title: string;
  body: string;
  state: string;
  labels: string[];
  htmlUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// GitHub API Types
export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  private: boolean;
  default_branch: string;
  topics: string[];
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string;
  email: string;
}

// AI Generation Types
export interface PersonaGenerationInput {
  repositoryAnalysis: RepositoryAnalysis;
  repositoryName: string;
  repositoryDescription?: string;
  topics: string[];
}

export interface SubredditSuggestion {
  name: string;
  displayName: string;
  description: string;
  subscribers: number;
  relevanceScore: number;
  relevanceReason: string;
}
