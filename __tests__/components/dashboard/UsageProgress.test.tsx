/**
 * UsageProgress Component Tests
 * Phase 7.4: Usage tracking component testing
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import UsageProgress from '@/components/dashboard/UsageProgress';

describe('UsageProgress Component', () => {
  const mockUsage = [
    {
      label: 'Repositories',
      current: 1,
      limit: 5,
      percentage: 20,
    },
    {
      label: 'Pain Points',
      current: 50,
      limit: 100,
      percentage: 50,
    },
    {
      label: 'Blog Posts',
      current: 18,
      limit: 20,
      percentage: 90,
    },
    {
      label: 'Unlimited Feature',
      current: 100,
      limit: null,
      percentage: null,
    },
  ];

  it('should render usage items with labels and counts', () => {
    render(<UsageProgress usage={mockUsage} planName="Pro" />);

    expect(screen.getByText('Repositories')).toBeInTheDocument();
    expect(screen.getByText('1 / 5')).toBeInTheDocument();
    expect(screen.getByText('Pain Points')).toBeInTheDocument();
    expect(screen.getByText('50 / 100')).toBeInTheDocument();
  });

  it('should show plan name', () => {
    render(<UsageProgress usage={mockUsage} planName="Pro" />);

    expect(screen.getByText('Pro')).toBeInTheDocument();
  });

  it('should display progress bars for limited features', () => {
    const { container } = render(<UsageProgress usage={mockUsage} planName="Pro" />);

    const progressBars = container.querySelectorAll('.bg-gray-200');
    // Should have 3 progress bars (unlimited feature doesn't have one)
    expect(progressBars.length).toBe(3);
  });

  it('should show warning for near-limit usage', () => {
    render(<UsageProgress usage={mockUsage} planName="Pro" />);

    // Blog Posts is at 90%, should have yellow warning color
    const blogPostsProgress = screen.getByText('18 / 20')
      .closest('div')
      ?.querySelector('.bg-yellow-600');
    expect(blogPostsProgress).toBeInTheDocument();
  });

  it('should show error for at-limit usage', () => {
    const atLimitUsage = [
      {
        label: 'Repositories',
        current: 5,
        limit: 5,
        percentage: 100,
      },
    ];

    render(<UsageProgress usage={atLimitUsage} planName="Free" />);

    expect(screen.getByText(/Limit reached/)).toBeInTheDocument();
    expect(screen.getByText(/Upgrade/)).toBeInTheDocument();
  });

  it('should show unlimited indicator for null limits', () => {
    render(<UsageProgress usage={mockUsage} planName="Enterprise" />);

    expect(screen.getByText('100')).toBeInTheDocument(); // current value
    const infinitySymbol = screen.getByText('∞');
    expect(infinitySymbol).toBeInTheDocument();
  });

  it('should show upgrade prompt for free tier', () => {
    render(<UsageProgress usage={mockUsage} planName="Free" />);

    expect(screen.getByText(/Upgrade to Pro/)).toBeInTheDocument();
  });

  it('should not show upgrade prompt for paid tiers', () => {
    render(<UsageProgress usage={mockUsage} planName="Pro" />);

    expect(screen.queryByText(/Upgrade to Pro/)).not.toBeInTheDocument();
  });

  it('should calculate progress bar width correctly', () => {
    const { container } = render(<UsageProgress usage={mockUsage} planName="Pro" />);

    // Find the progress bar for Repositories (20%)
    const progressBars = container.querySelectorAll('[style*="width"]');
    expect(progressBars.length).toBeGreaterThan(0);

    // Check that one has width: 20%
    const hasCorrectWidth = Array.from(progressBars).some(
      (bar) => (bar as HTMLElement).style.width === '20%'
    );
    expect(hasCorrectWidth).toBe(true);
  });
});
