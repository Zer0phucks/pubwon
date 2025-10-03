/**
 * Dashboard Page
 * Phase 6: Complete dashboard with analytics and usage tracking
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { UserNav } from '@/components/auth/UserNav';
import Link from 'next/link';
import StatCard from '@/components/dashboard/StatCard';
import UsageProgress from '@/components/dashboard/UsageProgress';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import AnalyticsChart from '@/components/dashboard/AnalyticsChart';
import { getUserUsageStatus } from '@/lib/services/usage-tracker';
import {
  getDashboardSummary,
  getPainPointsAnalytics,
  getBlogPostAnalytics,
  getNewsletterAnalytics,
  getActivityFeed,
} from '@/lib/services/analytics';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/login');
  }

  // Fetch all dashboard data in parallel
  const [
    usageStatus,
    summary,
    painPointsAnalytics,
    blogAnalytics,
    newsletterAnalytics,
    activityFeed,
  ] = await Promise.all([
    getUserUsageStatus(user.id),
    getDashboardSummary(user.id),
    getPainPointsAnalytics(user.id, 30),
    getBlogPostAnalytics(user.id, 30),
    getNewsletterAnalytics(user.id, 30),
    getActivityFeed(user.id, 20),
  ]);

  // Determine plan name
  const planName = 'Free'; // Default, will be updated from subscription data

  // Prepare usage data for UsageProgress component
  const usageData = [
    {
      label: 'Repositories',
      current: usageStatus.current.repositories,
      limit: usageStatus.limits.repositories,
      percentage: usageStatus.percentageUsed.repositories,
    },
    {
      label: 'Pain Points (this month)',
      current: usageStatus.current.painPointsExtracted,
      limit: usageStatus.limits.painPointsPerMonth,
      percentage: usageStatus.percentageUsed.painPoints,
    },
    {
      label: 'Blog Posts (this month)',
      current: usageStatus.current.blogPostsGenerated,
      limit: usageStatus.limits.blogPostsPerMonth,
      percentage: usageStatus.percentageUsed.blogPosts,
    },
    {
      label: 'Newsletters (this month)',
      current: usageStatus.current.newslettersSent,
      limit: usageStatus.limits.newslettersPerMonth,
      percentage: usageStatus.percentageUsed.newsletters,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white px-4 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-xl font-bold">PubWon</h1>
          <div className="flex items-center space-x-4">
            <Link
              href="/pricing"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Upgrade to Pro
            </Link>
            <UserNav user={user} />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Welcome back!</h2>
          <p className="mt-1 text-sm text-gray-600">
            Here's what's happening with your customer discovery.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Pain Points Discovered"
            value={summary.painPoints.thisMonth}
            change={summary.painPoints.change}
            icon={<span className="text-4xl">🎯</span>}
          />
          <StatCard
            title="Blog Posts Published"
            value={summary.blogPosts.thisMonth}
            change={summary.blogPosts.change}
            icon={<span className="text-4xl">📰</span>}
          />
          <StatCard
            title="Newsletters Sent"
            value={summary.newsletters.thisMonth}
            change={summary.newsletters.change}
            icon={<span className="text-4xl">📧</span>}
          />
          <StatCard
            title="GitHub Issues Created"
            value={summary.githubIssues.thisMonth}
            change={summary.githubIssues.change}
            icon={<span className="text-4xl">📝</span>}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main Content - 2/3 width */}
          <div className="lg:col-span-2 space-y-8">
            {/* Get Started Card */}
            <div className="rounded-lg bg-blue-50 p-6">
              <h3 className="text-lg font-medium text-blue-900">Get Started</h3>
              <p className="mt-2 text-sm text-blue-700">
                Connect your GitHub repository to start discovering customer pain points and
                generating content automatically.
              </p>
              <Link
                href="/onboarding"
                className="mt-4 inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
              >
                Start Onboarding
              </Link>
            </div>

            {/* Analytics Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnalyticsChart
                title="Pain Points Over Time"
                data={painPointsAnalytics.overTime.map(d => ({
                  label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  value: Number(d.count),
                }))}
                type="bar"
                color="blue"
              />
              <AnalyticsChart
                title="Blog Views"
                data={blogAnalytics.viewsOverTime.map(d => ({
                  label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  value: Number(d.views),
                }))}
                type="bar"
                color="green"
              />
            </div>

            {/* Quick Links */}
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="text-lg font-medium text-gray-900">Repositories</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {usageStatus.current.repositories}
                </p>
                <p className="mt-1 text-sm text-gray-600">Connected repositories</p>
                <Link
                  href="/repositories"
                  className="mt-4 inline-flex items-center text-sm font-medium text-gray-900 hover:text-gray-700"
                >
                  Manage repositories →
                </Link>
              </div>

              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="text-lg font-medium text-gray-900">Pain Points</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {summary.painPoints.thisMonth}
                </p>
                <p className="mt-1 text-sm text-gray-600">Discovered this month</p>
                <Link
                  href="/pain-points"
                  className="mt-4 inline-flex items-center text-sm font-medium text-gray-900 hover:text-gray-700"
                >
                  View pain points →
                </Link>
              </div>

              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="text-lg font-medium text-gray-900">Blog Posts</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {summary.blogPosts.thisMonth}
                </p>
                <p className="mt-1 text-sm text-gray-600">Published this month</p>
                <Link
                  href="/blog"
                  className="mt-4 inline-flex items-center text-sm font-medium text-gray-900 hover:text-gray-700"
                >
                  View blog posts →
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-6">
            {/* Usage Limits */}
            <UsageProgress usage={usageData} planName={planName} />

            {/* Newsletter Stats */}
            {newsletterAnalytics.totalSent > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Newsletter Performance
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Open Rate</span>
                      <span className="font-medium">{newsletterAnalytics.openRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 bg-green-600 rounded-full"
                        style={{ width: `${newsletterAnalytics.openRate}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Click Rate</span>
                      <span className="font-medium">{newsletterAnalytics.clickRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 bg-blue-600 rounded-full"
                        style={{ width: `${newsletterAnalytics.clickRate}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Based on {newsletterAnalytics.totalSent} newsletters
                  </p>
                </div>
              </div>
            )}

            {/* Activity Feed */}
            <ActivityFeed events={activityFeed} />
          </div>
        </div>
      </main>
    </div>
  );
}
