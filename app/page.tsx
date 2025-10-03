export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">
          PubWon - Customer Discovery Platform
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Phase 4: Reddit Analysis & GitHub Issue Creation
        </p>
        
        <div className="space-y-6">
          <section className="border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Features Implemented</h2>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Reddit API client with intelligent rate limiting</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Scheduled subreddit monitoring and scraping</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>AI-powered pain point extraction using OpenAI GPT-4</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Pain point review UI with approval/rejection workflow</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>GitHub API integration for automated issue creation</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Duplicate detection and bulk operations</span>
              </li>
            </ul>
          </section>

          <section className="border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Quick Start</h2>
            <div className="bg-gray-100 p-4 rounded font-mono text-sm">
              <div>./init.sh</div>
              <div className="mt-2">npm run dev</div>
            </div>
          </section>

          <section className="border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">API Endpoints</h2>
            <ul className="space-y-2 font-mono text-sm">
              <li className="text-blue-600">GET /api/pain-points</li>
              <li className="text-green-600">PATCH /api/pain-points</li>
              <li className="text-purple-600">POST /api/github/issues</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
