/**
 * StatCard Component Tests
 * Phase 6: Dashboard component testing
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import StatCard from '@/components/dashboard/StatCard';

describe('StatCard Component', () => {
  it('should render title and value', () => {
    render(<StatCard title="Test Metric" value={42} />);

    expect(screen.getByText('Test Metric')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should display positive change indicator', () => {
    render(<StatCard title="Test Metric" value={100} change={25} />);

    expect(screen.getByText(/25%/)).toBeInTheDocument();
    expect(screen.getByText('↑ 25%')).toHaveClass('text-green-600');
  });

  it('should display negative change indicator', () => {
    render(<StatCard title="Test Metric" value={75} change={-15} />);

    expect(screen.getByText(/15%/)).toBeInTheDocument();
    expect(screen.getByText('↓ 15%')).toHaveClass('text-red-600');
  });

  it('should render with custom icon', () => {
    const icon = <span data-testid="custom-icon">📊</span>;
    render(<StatCard title="Test Metric" value={50} icon={icon} />);

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('should display subtitle when provided', () => {
    render(<StatCard title="Test Metric" value={100} subtitle="Last updated today" />);

    expect(screen.getByText('Last updated today')).toBeInTheDocument();
  });

  it('should handle string values', () => {
    render(<StatCard title="Status" value="Active" />);

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should not show change when not provided', () => {
    render(<StatCard title="Test Metric" value={42} />);

    expect(screen.queryByText(/vs last month/)).not.toBeInTheDocument();
  });

  it('should show zero change correctly', () => {
    render(<StatCard title="Test Metric" value={100} change={0} />);

    expect(screen.getByText('↑ 0%')).toBeInTheDocument();
    expect(screen.getByText('↑ 0%')).toHaveClass('text-green-600');
  });
});
