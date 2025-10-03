# Quick Start Guide

Get PubWon up and running in 15 minutes.

## Prerequisites

- Node.js 18+ installed
- Git installed
- Accounts created (can do in parallel):
  - Supabase account (https://supabase.com)
  - Stripe account (https://stripe.com)
  - GitHub account (https://github.com)
  - OpenAI account (https://platform.openai.com)
  - Resend account (https://resend.com)
  - Reddit account (https://reddit.com)

## Step 1: Clone and Install (2 minutes)

```bash
# Navigate to project directory
cd /home/noob/pubwon

# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env.local
```

## Step 2: Configure Supabase (3 minutes)

1. Create new project at https://app.supabase.com
2. Get credentials from Settings → API:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
3. Run migration:
   ```bash
   # Connect to your Supabase database
   psql "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

   # Or use Supabase SQL Editor and paste contents of:
   # supabase/migrations/001_subscriptions_schema.sql
   ```

## Step 3: Configure Stripe (4 minutes)

1. Get API keys from https://dashboard.stripe.com/apikeys:
   ```bash
   STRIPE_SECRET_KEY=sk_test_your_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
   ```

2. Create products (https://dashboard.stripe.com/products):
   - Free: $0/month
   - Pro: $29/month
   - Save price IDs to `.env.local`

3. Set up webhook (https://dashboard.stripe.com/webhooks):
   - Use Stripe CLI for local testing:
     ```bash
     stripe listen --forward-to localhost:3000/api/webhooks/stripe
     ```
   - Save webhook secret:
     ```bash
     STRIPE_WEBHOOK_SECRET=whsec_your_secret
     ```

## Step 4: Configure GitHub (2 minutes)

1. Create OAuth App (https://github.com/settings/developers):
   - Callback URL: `http://localhost:3000/api/auth/github/callback`
   ```bash
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   ```

2. Create Personal Access Token (https://github.com/settings/tokens):
   - Scopes: `repo`, `read:user`, `user:email`
   ```bash
   GITHUB_ACCESS_TOKEN=ghp_your_token
   ```

## Step 5: Configure Reddit (2 minutes)

1. Create app at https://www.reddit.com/prefs/apps:
   - Type: script
   ```bash
   REDDIT_CLIENT_ID=your_14_char_id
   REDDIT_CLIENT_SECRET=your_secret
   REDDIT_USER_AGENT=web:pubwon:v1.0.0 (by /u/yourusername)
   ```

## Step 6: Configure OpenAI (1 minute)

1. Get API key from https://platform.openai.com/api-keys:
   ```bash
   OPENAI_API_KEY=sk-your_api_key
   OPENAI_MODEL=gpt-4o-mini
   ```

## Step 7: Configure Resend (1 minute)

1. Get API key from https://resend.com/api-keys:
   ```bash
   RESEND_API_KEY=re_your_api_key
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```

## Step 8: Start Development Server

```bash
npm run dev
```

Open http://localhost:3000

## Verify Setup

### Test Stripe Integration
```bash
# In one terminal: Forward webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# In browser: Navigate to pricing page
# Use test card: 4242 4242 4242 4242
```

### Test GitHub API
```bash
curl -H "Authorization: token YOUR_GITHUB_TOKEN" \
  https://api.github.com/user
```

### Test Reddit API
Check in your application or use the Reddit client directly.

### Test OpenAI API
```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Hello"}]}'
```

### Test Resend
```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"from":"noreply@yourdomain.com","to":"test@example.com","subject":"Test","html":"<p>Test</p>"}'
```

## Common Issues

### Database Migration Failed
- Verify PostgreSQL connection string
- Check if tables already exist
- Review migration logs

### Webhook Signature Verification Failed
- Ensure you're using the correct webhook secret
- Verify Stripe CLI is forwarding to correct URL
- Check that you're passing raw request body (not parsed JSON)

### GitHub OAuth Error
- Verify callback URL matches exactly
- Check client ID and secret
- Ensure OAuth app is not suspended

### Reddit API Rate Limit
- Implement exponential backoff
- Respect rate limit headers
- Use authenticated requests (higher limits)

### OpenAI API Error
- Verify API key is correct
- Check billing/usage limits
- Review request format

## Next Steps

1. **Read full documentation**:
   - `API_INTEGRATION_GUIDE.md` for detailed API setup
   - `STRIPE_SETUP_GUIDE.md` for Stripe configuration
   - `PHASE_1.3_1.4_COMPLETION_REPORT.md` for architecture overview

2. **Start building features**:
   - Implement authentication UI (Phase 2)
   - Build repository connection (Phase 3)
   - Create pain point analysis (Phase 4)

3. **Testing**:
   - Write unit tests for API clients
   - Create integration tests for flows
   - Set up E2E tests with Playwright

## Support

- Check `TASKS.md` for project roadmap
- Review `claudedocs/` for detailed guides
- GitHub Issues: [Create issue if you encounter problems]
- Email: [Your support email]

## Development Tips

1. **Use TypeScript**: All code is TypeScript - leverage type safety
2. **Follow patterns**: Check existing code for consistent patterns
3. **Test early**: Test integrations as you build features
4. **Monitor costs**: Watch API usage to avoid unexpected charges
5. **Secure secrets**: Never commit `.env.local` to version control

Happy coding! 🚀
