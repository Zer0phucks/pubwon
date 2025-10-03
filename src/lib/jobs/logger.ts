/**
 * Job execution logger with error handling and retry logic
 */

import { JobLog, JobStatus, JobResult, JobConfig } from './types';

class JobLogger {
  private logs: Map<string, JobLog> = new Map();

  /**
   * Start logging a job execution
   */
  startJob(jobName: string, config: JobConfig): string {
    const id = `${jobName}-${Date.now()}`;
    const log: JobLog = {
      id,
      jobName,
      status: 'running',
      startTime: new Date(),
      retryCount: 0,
      maxRetries: config.maxRetries,
    };

    this.logs.set(id, log);
    console.log(`[JOB START] ${jobName} - ${id}`);

    return id;
  }

  /**
   * Complete a job successfully
   */
  completeJob<T>(id: string, result: JobResult<T>): void {
    const log = this.logs.get(id);
    if (!log) return;

    log.status = 'completed';
    log.endTime = new Date();
    log.duration = log.endTime.getTime() - log.startTime.getTime();
    log.metadata = result.metadata;

    console.log(`[JOB COMPLETE] ${log.jobName} - ${id} - Duration: ${log.duration}ms`);

    if (result.warnings && result.warnings.length > 0) {
      console.warn(`[JOB WARNINGS] ${log.jobName}:`, result.warnings);
    }
  }

  /**
   * Fail a job
   */
  failJob(id: string, error: Error | string): void {
    const log = this.logs.get(id);
    if (!log) return;

    log.status = 'failed';
    log.endTime = new Date();
    log.duration = log.endTime.getTime() - log.startTime.getTime();
    log.error = error instanceof Error ? error.message : error;

    console.error(`[JOB FAILED] ${log.jobName} - ${id}:`, log.error);
  }

  /**
   * Retry a job
   */
  retryJob(id: string): void {
    const log = this.logs.get(id);
    if (!log) return;

    log.retryCount++;
    log.status = 'retrying';

    console.log(`[JOB RETRY] ${log.jobName} - ${id} - Attempt ${log.retryCount}/${log.maxRetries}`);
  }

  /**
   * Get job status
   */
  getJobStatus(id: string): JobLog | undefined {
    return this.logs.get(id);
  }

  /**
   * Get all logs
   */
  getAllLogs(): JobLog[] {
    return Array.from(this.logs.values());
  }

  /**
   * Clear old logs (older than 7 days)
   */
  clearOldLogs(): void {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    for (const [id, log] of this.logs.entries()) {
      if (log.startTime < sevenDaysAgo) {
        this.logs.delete(id);
      }
    }
  }
}

export const jobLogger = new JobLogger();

/**
 * Execute a job with retry logic and error handling
 */
export async function executeJob<T>(
  config: JobConfig,
  jobFunction: () => Promise<JobResult<T>>
): Promise<JobResult<T>> {
  if (!config.enabled) {
    return {
      success: false,
      error: 'Job is disabled',
    };
  }

  const jobId = jobLogger.startJob(config.name, config);
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Set timeout for job execution
      const result = await Promise.race<JobResult<T>>([
        jobFunction(),
        new Promise<JobResult<T>>((_, reject) =>
          setTimeout(() => reject(new Error('Job timeout')), config.timeout)
        ),
      ]);

      if (result.success) {
        jobLogger.completeJob(jobId, result);
        return result;
      } else {
        throw new Error(result.error || 'Job failed');
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < config.maxRetries) {
        jobLogger.retryJob(jobId);
        await new Promise(resolve => setTimeout(resolve, config.retryDelay));
      }
    }
  }

  // All retries exhausted
  const errorMessage = lastError?.message || 'Unknown error';
  jobLogger.failJob(jobId, errorMessage);

  return {
    success: false,
    error: `Job failed after ${config.maxRetries + 1} attempts: ${errorMessage}`,
  };
}
