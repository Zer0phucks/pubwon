#!/bin/bash

# PubWon Initialization Script
# This script sets up the development environment and runs validation checks

set -e  # Exit on error

echo "🚀 PubWon Initialization Script"
echo "================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
  echo "⚠️  .env file not found!"
  echo "📝 Creating .env from .env.example..."
  cp .env.example .env
  echo "✅ .env file created. Please update it with your credentials."
  echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Check environment variables
echo "🔍 Checking environment variables..."
if grep -q "your_supabase_url" .env 2>/dev/null; then
  echo "⚠️  Warning: Supabase URL not configured in .env"
fi
if grep -q "your_supabase_anon_key" .env 2>/dev/null; then
  echo "⚠️  Warning: Supabase Anon Key not configured in .env"
fi
echo ""

# Run linter
echo "🔍 Running ESLint..."
npm run lint || echo "⚠️  Linting issues found (non-blocking)"
echo ""

# Run tests
echo "🧪 Running tests..."
npm test || echo "⚠️  Some tests failed (non-blocking)"
echo ""

# Build check
echo "🏗️  Testing build..."
npm run build || {
  echo "❌ Build failed!"
  exit 1
}
echo "✅ Build successful"
echo ""

echo "✨ Initialization complete!"
echo ""
echo "Next steps:"
echo "1. Update .env file with your Supabase credentials"
echo "2. Configure GitHub OAuth in Supabase Dashboard"
echo "3. Run 'npm run dev' to start the development server"
echo "4. Visit http://localhost:3000"
echo ""
