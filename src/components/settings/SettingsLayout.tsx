'use client';

/**
 * Settings page layout wrapper
 */

import { ReactNode } from 'react';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </ErrorBoundary>
  );
}
