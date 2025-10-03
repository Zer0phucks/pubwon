import { GitHubScanner } from '@/lib/github-scanner';

describe('GitHubScanner', () => {
  it('should determine significant activity correctly', () => {
    const summary = {
      commits: Array(5).fill({ sha: '123', message: 'test', author: 'dev', date: '', url: '' }),
      pull_requests: [{ number: 1, title: 'PR', merged_at: '', url: '' }],
      issues: [{ number: 1, title: 'Issue', closed_at: '', url: '' }],
      releases: [{ tag_name: 'v1.0', name: 'Release', published_at: '', url: '' }],
      contributors: ['dev1', 'dev2'],
      files_changed: ['file1.ts', 'file2.ts'],
    };
    
    const isSignificant = GitHubScanner.isSignificantActivity(summary);
    expect(isSignificant).toBe(true);
  });

  it('should identify insignificant activity', () => {
    const summary = {
      commits: [{ sha: '123', message: 'test', author: 'dev', date: '', url: '' }],
      pull_requests: [],
      issues: [],
      releases: [],
      contributors: ['dev1'],
      files_changed: ['file1.ts'],
    };
    
    const isSignificant = GitHubScanner.isSignificantActivity(summary);
    expect(isSignificant).toBe(false);
  });
});
