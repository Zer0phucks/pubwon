/**
 * Comprehensive settings page
 * Allows users to configure all preferences
 */

import { Metadata } from 'next';
import SettingsLayout from '@/components/settings/SettingsLayout';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your account settings and preferences',
};

export default function SettingsPage() {
  return (
    <SettingsLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Settings Navigation */}
          <nav className="space-y-1">
            <SettingsNavItem href="#account" label="Account" icon="user" />
            <SettingsNavItem href="#repositories" label="Repositories" icon="code" />
            <SettingsNavItem href="#subreddits" label="Subreddits" icon="chat" />
            <SettingsNavItem href="#content" label="Content Generation" icon="document" />
            <SettingsNavItem href="#notifications" label="Notifications" icon="bell" />
            <SettingsNavItem href="#subscription" label="Subscription" icon="credit-card" />
            <SettingsNavItem href="#ai" label="AI Model" icon="cpu" />
            <SettingsNavItem href="#danger" label="Danger Zone" icon="warning" />
          </nav>

          {/* Settings Content */}
          <div className="lg:col-span-3 space-y-8">
            <AccountSettings />
            <RepositorySettings />
            <SubredditSettings />
            <ContentGenerationSettings />
            <NotificationSettings />
            <SubscriptionSettings />
            <AIModelSettings />
            <DangerZoneSettings />
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}

function SettingsNavItem({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <span className="mr-3">{getIcon(icon)}</span>
      {label}
    </a>
  );
}

function AccountSettings() {
  return (
    <section id="account" className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Display Name
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Your Name"
          />
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Save Changes
        </button>
      </div>
    </section>
  );
}

function RepositorySettings() {
  return (
    <section id="repositories" className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Repository Settings</h2>
      <p className="text-gray-600 mb-4">
        Configure which repositories to monitor and how often to scan for changes.
      </p>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">Auto-scan frequency</p>
            <p className="text-sm text-gray-500">How often to check for repository changes</p>
          </div>
          <select className="px-3 py-2 border border-gray-300 rounded-lg">
            <option>Daily</option>
            <option>Every 12 hours</option>
            <option>Every 6 hours</option>
            <option>Manual only</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">Minimum changes threshold</p>
            <p className="text-sm text-gray-500">
              Minimum commits before generating content
            </p>
          </div>
          <input
            type="number"
            min="1"
            max="50"
            defaultValue="5"
            className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>
    </section>
  );
}

function SubredditSettings() {
  return (
    <section id="subreddits" className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Subreddit Monitoring</h2>
      <p className="text-gray-600 mb-4">
        Configure which subreddits to monitor and analysis preferences.
      </p>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">Analysis frequency</p>
            <p className="text-sm text-gray-500">How often to analyze subreddit posts</p>
          </div>
          <select className="px-3 py-2 border border-gray-300 rounded-lg">
            <option>Weekly</option>
            <option>Bi-weekly</option>
            <option>Monthly</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">Minimum relevance score</p>
            <p className="text-sm text-gray-500">Filter out low-relevance posts</p>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            defaultValue="60"
            className="w-32"
          />
        </div>
      </div>
    </section>
  );
}

function ContentGenerationSettings() {
  return (
    <section id="content" className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Content Generation Settings
      </h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">Auto-publish blog posts</p>
            <p className="text-sm text-gray-500">
              Publish generated blog posts without manual review
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900">Auto-send newsletters</p>
            <p className="text-sm text-gray-500">
              Send newsletters automatically when new content is published
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Blog post tone
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option>Professional</option>
            <option>Casual</option>
            <option>Technical</option>
            <option>Friendly</option>
          </select>
        </div>
      </div>
    </section>
  );
}

function NotificationSettings() {
  return (
    <section id="notifications" className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Notification Preferences
      </h2>
      <div className="space-y-4">
        {[
          { label: 'New pain points discovered', key: 'pain_points' },
          { label: 'Blog post generated', key: 'blog_post' },
          { label: 'Newsletter sent', key: 'newsletter' },
          { label: 'Subscription changes', key: 'subscription' },
          { label: 'GitHub issue created', key: 'github_issue' },
        ].map(({ label, key }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-gray-700">{label}</span>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" defaultChecked />
                <span className="text-sm text-gray-600">In-app</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" defaultChecked />
                <span className="text-sm text-gray-600">Email</span>
              </label>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SubscriptionSettings() {
  return (
    <section id="subscription" className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Subscription</h2>
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-blue-900">Pro Plan</p>
              <p className="text-sm text-blue-700">$29/month</p>
            </div>
            <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full">
              Active
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <button className="w-full px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
            Upgrade Plan
          </button>
          <button className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Manage Billing
          </button>
          <button className="w-full px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors">
            Cancel Subscription
          </button>
        </div>
      </div>
    </section>
  );
}

function AIModelSettings() {
  const models = [
    // OpenAI Models
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', description: 'Fast & cost-effective', recommended: true, cost: '$0.15/1M tokens' },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Most advanced OpenAI model', cost: '$2.50/1M tokens' },
    { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', description: 'Previous generation flagship', cost: '$30/1M tokens' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', description: 'Legacy fast model', cost: '$0.50/1M tokens' },

    // Anthropic Models
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', description: 'Best for complex tasks', cost: '$3.00/1M tokens' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'Anthropic', description: 'Highest intelligence', cost: '$15/1M tokens' },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'Anthropic', description: 'Balanced performance', cost: '$3.00/1M tokens' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'Anthropic', description: 'Fast & efficient', cost: '$0.25/1M tokens' },
  ];

  return (
    <section id="ai" className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Model Selection</h2>
      <p className="text-gray-600 mb-4">
        Choose which AI model to use for content generation via Vercel AI Gateway.
      </p>

      <div className="mb-4">
        <select
          name="ai-model"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name} ({model.provider}) - {model.description} - {model.cost}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3 mt-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Model Information</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• All models accessed through Vercel AI Gateway</li>
            <li>• Costs shown are approximate input token rates</li>
            <li>• Recommended model balances quality and cost</li>
            <li>• OpenAI models excel at code and structured outputs</li>
            <li>• Anthropic models excel at analysis and long contexts</li>
          </ul>
        </div>

        <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Save Model Preference
        </button>
      </div>
    </section>
  );
}

function DangerZoneSettings() {
  return (
    <section id="danger" className="bg-red-50 border border-red-200 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-red-900 mb-4">Danger Zone</h2>
      <div className="space-y-4">
        <div>
          <p className="font-medium text-red-900">Export your data</p>
          <p className="text-sm text-red-700 mb-2">
            Download all your data in JSON format
          </p>
          <button className="px-4 py-2 bg-white text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors">
            Export Data
          </button>
        </div>
        <div>
          <p className="font-medium text-red-900">Delete your account</p>
          <p className="text-sm text-red-700 mb-2">
            Permanently delete your account and all associated data
          </p>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            Delete Account
          </button>
        </div>
      </div>
    </section>
  );
}

function getIcon(name: string) {
  const icons: Record<string, JSX.Element> = {
    user: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
    code: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
        />
      </svg>
    ),
    chat: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
    document: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    bell: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
    ),
    'credit-card': (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
        />
      </svg>
    ),
    cpu: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
        />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
  };
  return icons[name] || null;
}
