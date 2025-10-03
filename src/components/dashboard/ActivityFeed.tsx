/**
 * Activity Feed Component
 * Displays recent system events and actions
 */

'use client';

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityEvent {
  id: string;
  eventType: string;
  eventData: Record<string, any>;
  resourceType: string | null;
  createdAt: Date;
}

interface ActivityFeedProps {
  events: ActivityEvent[];
}

const eventTypeLabels: Record<string, string> = {
  pain_point_discovered: 'Pain Point Discovered',
  issue_created: 'GitHub Issue Created',
  blog_published: 'Blog Post Published',
  newsletter_sent: 'Newsletter Sent',
  repository_connected: 'Repository Connected',
  subreddit_added: 'Subreddit Added',
};

const eventTypeIcons: Record<string, string> = {
  pain_point_discovered: '🎯',
  issue_created: '📝',
  blog_published: '📰',
  newsletter_sent: '📧',
  repository_connected: '🔗',
  subreddit_added: '📊',
};

export default function ActivityFeed({ events }: ActivityFeedProps) {
  const [filter, setFilter] = useState<string>('all');

  const filteredEvents = filter === 'all'
    ? events
    : events.filter(e => e.eventType === filter);

  const eventTypes = Array.from(new Set(events.map(e => e.eventType)));

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border-gray-300 rounded-md"
          >
            <option value="all">All Events</option>
            {eventTypes.map(type => (
              <option key={type} value={type}>
                {eventTypeLabels[type] || type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {filteredEvents.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No activity yet. Start by connecting a repository!
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div key={event.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start">
                <span className="text-2xl mr-3">
                  {eventTypeIcons[event.eventType] || '📌'}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {eventTypeLabels[event.eventType] || event.eventType}
                  </p>
                  {event.eventData?.title && (
                    <p className="text-sm text-gray-600 mt-1">
                      {event.eventData.title}
                    </p>
                  )}
                  {event.eventData?.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {event.eventData.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
