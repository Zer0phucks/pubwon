/**
 * Tests for job logger and execution
 */

import { executeJob, jobLogger } from '@/lib/jobs/logger';
import { JOB_CONFIGS, JobResult } from '@/lib/jobs/types';

describe('Job Logger', () => {
  beforeEach(() => {
    // Clear any existing logs
    jest.clearAllMocks();
  });

  describe('executeJob', () => {
    it('should execute a successful job', async () => {
      const mockJob = jest.fn<Promise<JobResult>, []>().mockResolvedValue({
        success: true,
        data: { test: 'data' },
      });

      const result = await executeJob(JOB_CONFIGS.DAILY_REPO_SCAN, mockJob);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ test: 'data' });
      expect(mockJob).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const mockJob = jest.fn<Promise<JobResult>, []>()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValueOnce({
          success: true,
          data: { test: 'data' },
        });

      const config = {
        ...JOB_CONFIGS.DAILY_REPO_SCAN,
        maxRetries: 3,
        retryDelay: 10,
      };

      const result = await executeJob(config, mockJob);

      expect(result.success).toBe(true);
      expect(mockJob).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const mockJob = jest.fn<Promise<JobResult>, []>().mockRejectedValue(
        new Error('Persistent failure')
      );

      const config = {
        ...JOB_CONFIGS.DAILY_REPO_SCAN,
        maxRetries: 2,
        retryDelay: 10,
      };

      const result = await executeJob(config, mockJob);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Persistent failure');
      expect(mockJob).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it('should respect timeout', async () => {
      const mockJob = jest.fn<Promise<JobResult>, []>().mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true, data: {} }), 2000)
          )
      );

      const config = {
        ...JOB_CONFIGS.DAILY_REPO_SCAN,
        timeout: 100,
        maxRetries: 0,
      };

      const result = await executeJob(config, mockJob);

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    }, 10000);

    it('should not execute disabled jobs', async () => {
      const mockJob = jest.fn<Promise<JobResult>, []>();

      const config = {
        ...JOB_CONFIGS.DAILY_REPO_SCAN,
        enabled: false,
      };

      const result = await executeJob(config, mockJob);

      expect(result.success).toBe(false);
      expect(result.error).toContain('disabled');
      expect(mockJob).not.toHaveBeenCalled();
    });
  });

  describe('JobLogger', () => {
    it('should log job start and completion', () => {
      const jobId = jobLogger.startJob(
        'test-job',
        JOB_CONFIGS.DAILY_REPO_SCAN
      );

      const status = jobLogger.getJobStatus(jobId);
      expect(status?.status).toBe('running');

      jobLogger.completeJob(jobId, { success: true });

      const finalStatus = jobLogger.getJobStatus(jobId);
      expect(finalStatus?.status).toBe('completed');
    });

    it('should track retries', () => {
      const jobId = jobLogger.startJob(
        'test-job',
        JOB_CONFIGS.DAILY_REPO_SCAN
      );

      jobLogger.retryJob(jobId);
      jobLogger.retryJob(jobId);

      const status = jobLogger.getJobStatus(jobId);
      expect(status?.retryCount).toBe(2);
    });

    it('should log failures with error message', () => {
      const jobId = jobLogger.startJob(
        'test-job',
        JOB_CONFIGS.DAILY_REPO_SCAN
      );

      jobLogger.failJob(jobId, new Error('Test error'));

      const status = jobLogger.getJobStatus(jobId);
      expect(status?.status).toBe('failed');
      expect(status?.error).toBe('Test error');
    });
  });
});
