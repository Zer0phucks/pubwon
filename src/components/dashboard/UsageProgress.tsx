/**
 * Usage Progress Component
 * Displays usage limits with progress bars
 */

import React from 'react';
import Link from 'next/link';

interface UsageItem {
  label: string;
  current: number;
  limit: number | null;
  percentage: number | null;
}

interface UsageProgressProps {
  usage: UsageItem[];
  planName: string;
}

export default function UsageProgress({ usage, planName }: UsageProgressProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Usage Limits</h3>
        <span className="text-sm font-medium text-blue-600">{planName}</span>
      </div>

      <div className="space-y-4">
        {usage.map((item) => {
          const isUnlimited = item.limit === null;
          const isNearLimit = item.percentage !== null && item.percentage >= 80;
          const isAtLimit = item.percentage !== null && item.percentage >= 100;

          return (
            <div key={item.label}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">{item.label}</span>
                <span className="text-gray-600">
                  {item.current} {isUnlimited ? '' : `/ ${item.limit}`}
                  {isUnlimited && <span className="ml-1 text-green-600">∞</span>}
                </span>
              </div>
              {!isUnlimited && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isAtLimit
                        ? 'bg-red-600'
                        : isNearLimit
                        ? 'bg-yellow-600'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(item.percentage || 0, 100)}%` }}
                  />
                </div>
              )}
              {isAtLimit && (
                <p className="mt-1 text-xs text-red-600">
                  Limit reached. <Link href="/pricing" className="underline">Upgrade</Link> for more.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {planName === 'Free' && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900">
            <Link href="/pricing" className="font-medium underline">
              Upgrade to Pro
            </Link>{' '}
            for unlimited access and higher limits
          </p>
        </div>
      )}
    </div>
  );
}
