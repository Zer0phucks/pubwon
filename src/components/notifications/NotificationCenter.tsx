'use client';

/**
 * In-app notification center
 * Displays real-time notifications to users
 */

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Notification {
  id: string;
  type: 'pain_point' | 'blog_published' | 'newsletter_sent' | 'subscription_change';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export default function NotificationCenter({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();

    // Subscribe to real-time notifications
    const supabase = createClient();
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_events',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const event = payload.new;
          if (shouldNotify(event.event_type)) {
            const notification = eventToNotification(event);
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadNotifications = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('user_id', userId)
      .in('event_type', [
        'pain_points_discovered',
        'blog_post_generated',
        'newsletter_sent',
        'subscription_status_changed',
      ])
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      const notifs = data.map(eventToNotification);
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    }
  };

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Update in database (implementation depends on schema)
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);

    // Update in database
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                No notifications yet
              </div>
            ) : (
              notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  notification,
  onMarkAsRead,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}) {
  const icons = {
    pain_point: '🔍',
    blog_published: '📝',
    newsletter_sent: '📧',
    subscription_change: '💳',
  };

  return (
    <div
      className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        !notification.read ? 'bg-blue-50' : ''
      }`}
    >
      <div className="flex items-start">
        <span className="text-2xl mr-3">{icons[notification.type]}</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(notification.createdAt).toLocaleDateString()}
          </p>
        </div>
        {!notification.read && (
          <button
            onClick={() => onMarkAsRead(notification.id)}
            className="ml-2 w-2 h-2 bg-blue-600 rounded-full"
            aria-label="Mark as read"
          />
        )}
      </div>
      {notification.actionUrl && (
        <a
          href={notification.actionUrl}
          className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-block"
        >
          View Details →
        </a>
      )}
    </div>
  );
}

function shouldNotify(eventType: string): boolean {
  return [
    'pain_points_discovered',
    'blog_post_generated',
    'newsletter_sent',
    'subscription_status_changed',
  ].includes(eventType);
}

function eventToNotification(event: any): Notification {
  const typeMap: Record<string, Notification['type']> = {
    pain_points_discovered: 'pain_point',
    blog_post_generated: 'blog_published',
    newsletter_sent: 'newsletter_sent',
    subscription_status_changed: 'subscription_change',
  };

  const messages: Record<string, (data: any) => { title: string; message: string }> = {
    pain_points_discovered: (data) => ({
      title: 'New Pain Points Discovered',
      message: `Found ${data.painPointsCount} new customer pain points from ${data.subreddit}`,
    }),
    blog_post_generated: (data) => ({
      title: 'Blog Post Generated',
      message: `New blog post ready for review: "${data.title}"`,
    }),
    newsletter_sent: (data) => ({
      title: 'Newsletter Sent',
      message: `Newsletter sent to ${data.recipientCount} subscribers`,
    }),
    subscription_status_changed: (data) => ({
      title: 'Subscription Updated',
      message: `Your subscription status changed to ${data.newStatus}`,
    }),
  };

  const { title, message } = messages[event.event_type]?.(event.event_data) || {
    title: 'Notification',
    message: '',
  };

  return {
    id: event.id,
    type: typeMap[event.event_type] || 'pain_point',
    title,
    message,
    read: false,
    createdAt: event.created_at,
  };
}
