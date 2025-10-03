import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-blue-600 to-purple-600 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>

        <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
          <div className="mx-auto max-w-2xl flex-shrink-0 lg:mx-0 lg:max-w-xl lg:pt-8">
            <div className="mt-24 sm:mt-32 lg:mt-16">
              <span className="inline-flex items-center space-x-2 rounded-full bg-blue-50 px-4 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                <span>🚀 AI-Powered Customer Discovery</span>
              </span>
            </div>

            <h1 className="mt-10 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Turn Reddit Conversations Into Product Features
            </h1>

            <p className="mt-6 text-lg leading-8 text-gray-600">
              Automatically discover customer pain points from Reddit, generate GitHub issues,
              and create engaging content—all powered by AI. Build products your users actually want.
            </p>

            <div className="mt-10 flex items-center gap-x-6">
              <Link
                href="/auth/login"
                className="rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
              >
                Start Free Trial
              </Link>
              <Link
                href="#features"
                className="text-base font-semibold leading-7 text-gray-900 hover:text-gray-700 transition-colors"
              >
                See how it works <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-x-8">
              <div className="flex items-center gap-x-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 ring-2 ring-white" />
                  ))}
                </div>
                <span className="text-sm text-gray-600">100+ developers building smarter</span>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32">
            <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
              <div className="rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="data:image/svg+xml,%3Csvg width='800' height='600' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='800' height='600' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-size='24' fill='%236b7280' text-anchor='middle' dominant-baseline='middle'%3EDashboard Preview%3C/text%3E%3C/svg%3E"
                  alt="Product dashboard"
                  width={2432}
                  height={1442}
                  className="w-[76rem] rounded-md shadow-2xl ring-1 ring-gray-900/10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">Everything you need</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Customer discovery on autopilot
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Connect your GitHub repo, and we&apos;ll handle the rest—from finding pain points to creating issues and content.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-7xl sm:mt-20 lg:mt-24">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3 lg:gap-y-16">
              <Feature
                icon="🎯"
                title="Reddit Pain Point Mining"
                description="AI scans relevant subreddits to identify customer pain points, frustrations, and feature requests in real conversations."
              />
              <Feature
                icon="🤖"
                title="AI-Powered Analysis"
                description="GPT-4 and Claude analyze discussions, categorize issues by severity, and extract actionable insights with evidence."
              />
              <Feature
                icon="📝"
                title="Auto GitHub Issues"
                description="Approved pain points become well-structured GitHub issues with context, evidence, and proper labels automatically."
              />
              <Feature
                icon="✍️"
                title="Blog Post Generation"
                description="Track your repository activity and generate technical blog posts about your development progress automatically."
              />
              <Feature
                icon="📧"
                title="Newsletter Automation"
                description="Convert blog posts into engaging newsletters and send them to subscribers without lifting a finger."
              />
              <Feature
                icon="⚡"
                title="Multi-Model AI"
                description="Choose from OpenAI and Anthropic models via Vercel AI Gateway. Pick the best model for each task."
              />
            </dl>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              How it works
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Four simple steps to transform Reddit conversations into product features
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-7xl">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
              <Step
                number="1"
                title="Connect GitHub"
                description="Link your GitHub repository and authenticate with OAuth. We'll analyze your project to understand your target users."
              />
              <Step
                number="2"
                title="AI Discovers Pain Points"
                description="Our AI monitors relevant subreddits, identifies customer pain points, and extracts evidence from real discussions."
              />
              <Step
                number="3"
                title="Review & Approve"
                description="Review discovered pain points in your dashboard. Approve the ones that matter, reject the noise."
              />
              <Step
                number="4"
                title="Auto-Create Issues"
                description="Approved pain points become GitHub issues with full context, evidence, and proper categorization."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-blue-600 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-none">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Why developers love PubWon
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
              <Benefit
                title="Save 10+ hours per week"
                description="Stop manually browsing Reddit and forums. Let AI find customer insights while you focus on building."
              />
              <Benefit
                title="Build what users want"
                description="Base your roadmap on real customer pain points, not assumptions. Validate ideas before you code."
              />
              <Benefit
                title="Stay connected to users"
                description="Keep your finger on the pulse of customer needs without the manual research grind."
              />
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Ready to build products users love?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
              Join developers who are building smarter with AI-powered customer discovery.
              Start your free trial today—no credit card required.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/auth/login"
                className="rounded-md bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
              >
                Start Free Trial
              </Link>
              <Link
                href="/pricing"
                className="text-base font-semibold leading-7 text-gray-900 hover:text-gray-700 transition-colors"
              >
                View Pricing <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-gray-400">
              © 2024 PubWon. All rights reserved.
            </p>
            <div className="flex gap-x-6">
              <Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/docs" className="text-sm text-gray-400 hover:text-white transition-colors">
                Documentation
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Feature({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="relative">
      <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white text-xl">
          {icon}
        </div>
        {title}
      </dt>
      <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
        <p className="flex-auto">{description}</p>
      </dd>
    </div>
  )
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="relative flex flex-col items-start">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-lg">
        {number}
      </div>
      <h3 className="mt-6 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-base text-gray-600">{description}</p>
    </div>
  )
}

function Benefit({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-base text-blue-100">{description}</p>
    </div>
  )
}
