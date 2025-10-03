import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserNav } from '@/components/auth/UserNav'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white px-4 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-xl font-bold">PubWon</h1>
          <UserNav user={user} />
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome back!</h2>
            <p className="mt-1 text-sm text-gray-600">
              Your customer discovery dashboard
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-medium text-gray-900">Repositories</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
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
              <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
              <p className="mt-1 text-sm text-gray-600">Discovered this week</p>
              <Link
                href="/pain-points"
                className="mt-4 inline-flex items-center text-sm font-medium text-gray-900 hover:text-gray-700"
              >
                View pain points →
              </Link>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-medium text-gray-900">Blog Posts</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
              <p className="mt-1 text-sm text-gray-600">Published this month</p>
              <Link
                href="/blog"
                className="mt-4 inline-flex items-center text-sm font-medium text-gray-900 hover:text-gray-700"
              >
                View blog posts →
              </Link>
            </div>
          </div>

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
        </div>
      </main>
    </div>
  )
}
