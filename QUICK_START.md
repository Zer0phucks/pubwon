# Quick Start Guide - Phase 5

## 30-Second Setup

```bash
npm install
cp .env.example .env
# Edit .env with your API keys
./init.sh
npm run dev
```

## Essential API Keys

```env
SUPABASE_SERVICE_ROLE_KEY=your_key    # From Supabase dashboard
OPENAI_API_KEY=your_key               # From OpenAI
RESEND_API_KEY=your_key               # From Resend
CRON_SECRET=random_secret             # Generate random string
```

## Database Setup

1. Go to Supabase SQL Editor
2. Copy contents of `supabase/schema.sql`
3. Paste and execute
4. ✅ Done

## Testing Locally

```bash
# Test repository scanner
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/scan-repositories

# Test content generator
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/generate-content

# View blog
open http://localhost:3000/blog

# Check RSS feed
open http://localhost:3000/api/rss
```

## Deploy to Vercel

```bash
vercel --prod
```

Then add environment variables in Vercel dashboard.

## Verify Deployment

- ✅ Cron jobs appear in Vercel dashboard
- ✅ RSS feed accessible at /api/rss
- ✅ Blog page loads at /blog
- ✅ Subscribe endpoint works at /api/subscribe

## Common Issues

**Cron not running:**
- Check CRON_SECRET is set in Vercel
- Verify cron jobs enabled in project settings

**Blog posts not generating:**
- Verify OPENAI_API_KEY has credits
- Check repository activity is significant (≥10 points)

**Emails not sending:**
- Verify RESEND_API_KEY
- Check domain is verified in Resend

## File Structure

```
lib/
  github-scanner.ts      # Repository monitoring
  blog-generator.ts      # AI content creation
  newsletter-generator.ts # Email content
  email-service.ts       # Email sending

app/
  api/cron/             # Cron endpoints
  blog/                 # Blog pages
  api/subscribe/        # Subscription
  api/rss/              # RSS feed

supabase/
  schema.sql            # Database schema

tests/
  *.test.ts             # Test files
```

## Next Steps

1. Add test repository to system
2. Wait for cron job or trigger manually
3. Review generated blog post draft
4. Publish and send newsletter
5. Monitor analytics

## Support

- 📖 Full docs: README.md
- 🚀 Deployment: DEPLOYMENT.md
- 📊 Details: PHASE5_COMPLETION_REPORT.md
- 📋 Summary: PHASE5_SUMMARY.md

## Cheat Sheet

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm test                 # Run tests
npm run lint             # Lint code

# Database
# Use Supabase dashboard SQL Editor

# Deployment
vercel                   # Deploy preview
vercel --prod            # Deploy production

# Debugging
# Check Vercel function logs
# Check Supabase logs
# Check Resend dashboard
```

That's it! You're ready to go. 🚀
