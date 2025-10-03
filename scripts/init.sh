#!/bin/bash

set -e

echo "🚀 Initializing Pubwon Project..."

# Check if .env exists
if [ ! -f .env ]; then
  echo "📝 Creating .env file from .env.example..."
  cp .env.example .env
  echo "⚠️  Please update .env with your actual credentials"
else
  echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

# Type check
echo "🔍 Running type check..."
npm run type-check || echo "⚠️  Type check failed. Fix errors before continuing."

# Lint check
echo "🧹 Running linter..."
npm run lint || echo "⚠️  Linting issues found. Fix before committing."

echo ""
echo "✨ Project initialized successfully!"
echo ""
echo "Next steps:"
echo "1. Update .env with your actual credentials"
echo "2. Create a Supabase project at https://supabase.com"
echo "3. Run migrations: supabase db push (if using Supabase CLI)"
echo "4. Start development: npm run dev"
echo ""
