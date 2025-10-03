/**
 * Analytics Chart Component
 * Simple line/bar chart for time series data
 */

'use client';

import React from 'react';

interface ChartDataPoint {
  label: string;
  value: number;
}

interface AnalyticsChartProps {
  data: ChartDataPoint[];
  title: string;
  type?: 'line' | 'bar';
  color?: string;
}

export default function AnalyticsChart({
  data,
  title,
  type = 'bar',
  color = 'blue',
}: AnalyticsChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  };

  const barColor = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No data available yet
        </div>
      ) : (
        <div className="space-y-3">
          {type === 'bar' ? (
            data.map((point, index) => (
              <div key={index}>
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>{point.label}</span>
                  <span className="font-medium">{point.value}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${barColor} transition-all`}
                    style={{ width: `${(point.value / maxValue) * 100}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="relative h-48">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  points={data.map((point, i) => {
                    const x = (i / (data.length - 1)) * 100;
                    const y = 100 - (point.value / maxValue) * 80;
                    return `${x},${y}`;
                  }).join(' ')}
                />
              </svg>
              <div className="flex justify-between mt-2 text-xs text-gray-600">
                {data.map((point, i) => (
                  <span key={i}>{point.label}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
