/**
 * Job monitoring and execution types
 */

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'retrying';

export interface JobLog {
  id: string;
  jobName: string;
  status: JobStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  error?: string;
  metadata?: Record<string, any>;
  retryCount: number;
  maxRetries: number;
}

export interface JobResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
  metadata?: Record<string, any>;
}

export interface JobConfig {
  name: string;
  maxRetries: number;
  retryDelay: number; // in milliseconds
  timeout: number; // in milliseconds
  enabled: boolean;
}

export const JOB_CONFIGS: Record<string, JobConfig> = {
  DAILY_REPO_SCAN: {
    name: 'Daily Repository Scanner',
    maxRetries: 3,
    retryDelay: 60000, // 1 minute
    timeout: 300000, // 5 minutes
    enabled: true,
  },
  WEEKLY_SUBREDDIT_ANALYSIS: {
    name: 'Weekly Subreddit Analysis',
    maxRetries: 2,
    retryDelay: 120000, // 2 minutes
    timeout: 600000, // 10 minutes
    enabled: true,
  },
  DAILY_BLOG_GENERATION: {
    name: 'Daily Blog Post Generation',
    maxRetries: 3,
    retryDelay: 60000,
    timeout: 300000,
    enabled: true,
  },
  NEWSLETTER_SEND: {
    name: 'Newsletter Sending',
    maxRetries: 5,
    retryDelay: 30000, // 30 seconds
    timeout: 900000, // 15 minutes
    enabled: true,
  },
  SUBSCRIPTION_CHECK: {
    name: 'Subscription Status Check',
    maxRetries: 3,
    retryDelay: 60000,
    timeout: 120000, // 2 minutes
    enabled: true,
  },
  DATABASE_CLEANUP: {
    name: 'Database Cleanup',
    maxRetries: 2,
    retryDelay: 60000,
    timeout: 180000, // 3 minutes
    enabled: true,
  },
};
