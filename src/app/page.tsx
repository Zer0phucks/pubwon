import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Customer Discovery,{' '}
          <span className="text-gray-600">Integrated</span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Discover customer pain points from Reddit, create GitHub issues, and generate
          content automatically. Stay connected to your users while you build.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/auth/login"
            className="rounded-md bg-gray-900 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
          >
            Get Started
          </Link>
          <Link
            href="/about"
            className="text-base font-semibold leading-7 text-gray-900"
          >
            Learn more <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">Reddit Analysis</h3>
            <p className="mt-2 text-sm text-gray-600">
              Automatically discover pain points from relevant subreddits
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">GitHub Integration</h3>
            <p className="mt-2 text-sm text-gray-600">
              Convert insights into actionable GitHub issues
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">Auto Content</h3>
            <p className="mt-2 text-sm text-gray-600">
              Generate blog posts and newsletters automatically
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
