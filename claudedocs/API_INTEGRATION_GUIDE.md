# API Integration Guide - Phase 1.4

Complete guide for setting up all external API integrations required for the PubWon application.

## Table of Contents

1. [GitHub OAuth & API Setup](#github-oauth--api-setup)
2. [Reddit API Setup](#reddit-api-setup)
3. [AI API Options (OpenAI/Anthropic)](#ai-api-options)
4. [Email Service Provider Setup](#email-service-provider-setup)
5. [Stripe Setup (Reference)](#stripe-setup)
6. [Security Best Practices](#security-best-practices)

---

## GitHub OAuth & API Setup

### Overview
GitHub integration enables:
- User authentication via OAuth
- Repository access and analysis
- Issue creation from pain points
- Webhook notifications for repository changes
- Commit and PR monitoring

### Registration Steps

#### 1. Create GitHub OAuth App

1. Navigate to GitHub Settings:
   - Go to https://github.com/settings/developers
   - Click "OAuth Apps" → "New OAuth App"

2. Fill in Application Details:
   ```
   Application name: PubWon
   Homepage URL: https://yourdomain.com (or http://localhost:3000 for dev)
   Authorization callback URL: https://yourdomain.com/api/auth/github/callback
   ```

3. Register Application and Save Credentials:
   - Copy `Client ID` → `GITHUB_CLIENT_ID`
   - Generate new client secret → `GITHUB_CLIENT_SECRET`

#### 2. Create GitHub Personal Access Token (PAT)

For API operations beyond OAuth scope:

1. Navigate to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Configure token:
   ```
   Note: PubWon API Access
   Expiration: No expiration (or custom)

   Scopes required:
   ✓ repo (Full control of private repositories)
   ✓ read:user (Read user profile data)
   ✓ user:email (Access user email addresses)
   ✓ write:repo_hook (Write repository hooks for webhooks)
   ```
4. Generate token → Save as `GITHUB_ACCESS_TOKEN`

#### 3. Set Up GitHub App (Optional - for Webhooks)

For production webhook handling:

1. Navigate to https://github.com/settings/apps
2. Click "New GitHub App"
3. Configure:
   ```
   GitHub App name: PubWon Webhook Handler
   Homepage URL: https://yourdomain.com
   Webhook URL: https://yourdomain.com/api/webhooks/github
   Webhook secret: Generate random secret → GITHUB_WEBHOOK_SECRET

   Repository permissions:
   - Contents: Read
   - Issues: Read & Write
   - Metadata: Read
   - Pull requests: Read

   Subscribe to events:
   ✓ Push
   ✓ Pull request
   ✓ Issues
   ✓ Release
   ```
4. Create app and download private key
5. Save `App ID` → `GITHUB_APP_ID`
6. Save private key content → `GITHUB_APP_PRIVATE_KEY`

### Environment Variables

```bash
# OAuth credentials
GITHUB_CLIENT_ID=Iv1.your_client_id
GITHUB_CLIENT_SECRET=your_client_secret

# Personal Access Token
GITHUB_ACCESS_TOKEN=ghp_your_personal_access_token

# GitHub App (optional)
GITHUB_APP_ID=123456
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET=your_random_webhook_secret
```

### API Rate Limits

- **Authenticated requests**: 5,000 requests/hour
- **OAuth app**: 5,000 requests/hour per user
- **GitHub App**: 5,000 requests/hour per installation
- **Search API**: 30 requests/minute

### GitHub API Client Setup

See `/src/lib/github.ts` for implementation details.

---

## Reddit API Setup

### Overview
Reddit integration enables:
- Subreddit monitoring and analysis
- Discussion scraping for pain point extraction
- Trending topic identification
- User sentiment analysis

### Registration Steps

#### 1. Create Reddit Application

1. Navigate to https://www.reddit.com/prefs/apps
2. Click "Create App" or "Create Another App"
3. Fill in application details:
   ```
   Name: PubWon
   App type: Select "script" (for server-side access)
   Description: Customer discovery and pain point analysis tool
   About URL: https://yourdomain.com
   Redirect URI: http://localhost:3000/api/auth/reddit/callback
   ```
4. Click "Create app"

#### 2. Save Credentials

After creation, you'll see:
- **Client ID**: 14-character string below app name → `REDDIT_CLIENT_ID`
- **Client Secret**: Longer string labeled "secret" → `REDDIT_CLIENT_SECRET`

#### 3. Create User Agent

Format: `platform:app_id:version (by /u/username)`

Example: `web:pubwon:v1.0.0 (by /u/your_reddit_username)`

### Environment Variables

```bash
REDDIT_CLIENT_ID=your_14_char_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USER_AGENT=web:pubwon:v1.0.0 (by /u/your_username)

# Optional: For authenticated requests
REDDIT_USERNAME=your_reddit_username
REDDIT_PASSWORD=your_reddit_password
```

### API Rate Limits

- **OAuth requests**: 60 requests/minute
- **Unauthenticated**: Heavily restricted, not recommended
- **Best practice**: Implement exponential backoff and respect rate limit headers

### Reddit API Endpoints Used

```
GET /r/{subreddit}/hot - Get hot posts
GET /r/{subreddit}/new - Get new posts
GET /r/{subreddit}/top - Get top posts (time filtered)
GET /comments/{post_id} - Get post comments
GET /search - Search across Reddit
GET /r/{subreddit}/about - Get subreddit info
```

### Reddit API Client Setup

See `/src/lib/reddit.ts` for implementation using `snoowrap` library.

---

## AI API Options

### Option 1: OpenAI (Recommended for MVP)

#### Overview
- **Best for**: Content generation, pain point extraction, ICP persona creation
- **Models**: GPT-4o, GPT-4o-mini (cost-effective)
- **Pricing**: Pay-per-token, predictable costs
- **Latency**: Fast response times
- **Context window**: 128K tokens

#### Setup Steps

1. Create OpenAI Account:
   - Navigate to https://platform.openai.com/signup
   - Complete registration

2. Add Payment Method:
   - Go to https://platform.openai.com/account/billing
   - Add payment method
   - Set usage limits (recommended: $50/month for development)

3. Generate API Key:
   - Navigate to https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Name: "PubWon Production" or "PubWon Development"
   - Copy key → `OPENAI_API_KEY`

4. (Optional) Create Organization:
   - Go to https://platform.openai.com/account/organization
   - Create organization for better billing tracking
   - Copy `Organization ID` → `OPENAI_ORG_ID`

#### Environment Variables

```bash
OPENAI_API_KEY=sk-proj-your_api_key_here
OPENAI_MODEL=gpt-4o-mini  # or gpt-4o for better quality
OPENAI_ORG_ID=org-your_organization_id  # optional
```

#### Pricing (as of 2024)

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| GPT-4o-mini | $0.15 | $0.60 |
| GPT-4o | $2.50 | $10.00 |

**Estimated costs for typical usage**:
- Pain point extraction: ~5K tokens/request → $0.003 per analysis
- Blog post generation: ~10K tokens/request → $0.09 per post
- Newsletter generation: ~8K tokens/request → $0.07 per newsletter

#### Rate Limits (Tier 1)

- **Requests per minute**: 500
- **Tokens per minute**: 200,000
- **Tokens per day**: 10,000,000

### Option 2: Anthropic Claude (Alternative)

#### Overview
- **Best for**: Complex reasoning, analysis, longer context
- **Models**: Claude 3.5 Sonnet, Claude 3 Opus
- **Pricing**: Competitive with OpenAI
- **Latency**: Similar to OpenAI
- **Context window**: 200K tokens

#### Setup Steps

1. Create Anthropic Account:
   - Navigate to https://console.anthropic.com/
   - Complete registration

2. Generate API Key:
   - Go to https://console.anthropic.com/settings/keys
   - Click "Create Key"
   - Name: "PubWon"
   - Copy key → `ANTHROPIC_API_KEY`

#### Environment Variables

```bash
ANTHROPIC_API_KEY=sk-ant-your_api_key_here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022  # or claude-3-opus-20240229
```

#### Pricing (as of 2024)

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| Claude 3.5 Sonnet | $3.00 | $15.00 |
| Claude 3 Opus | $15.00 | $75.00 |

#### Rate Limits

- **Requests per minute**: 50 (Tier 1)
- **Tokens per minute**: 40,000 (Tier 1)
- **Tokens per day**: 1,000,000 (Tier 1)

### Recommendation

**For MVP**: Use OpenAI GPT-4o-mini
- Lower cost for high-volume operations
- Faster response times
- Mature ecosystem and tooling
- Better rate limits for startups

**Consider Claude for**:
- Complex reasoning tasks
- Longer context requirements (>100K tokens)
- Specific use cases where Claude excels

### AI API Client Setup

See `/src/lib/ai.ts` for unified AI client implementation.

---

## Email Service Provider Setup

### Option 1: Resend (Recommended)

#### Overview
- **Best for**: Modern email infrastructure, developer-friendly
- **Pricing**: Free tier: 100 emails/day, 3,000/month
- **Features**: Built-in domain verification, React email templates
- **Deliverability**: Excellent (built on AWS SES)
- **API**: Simple REST API, great DX

#### Setup Steps

1. Create Resend Account:
   - Navigate to https://resend.com/signup
   - Sign up with email or GitHub

2. Generate API Key:
   - Go to https://resend.com/api-keys
   - Click "Create API Key"
   - Name: "PubWon Production"
   - Permissions: Full access (or limit to sending only)
   - Copy key → `RESEND_API_KEY`

3. Add and Verify Domain:
   - Go to https://resend.com/domains
   - Click "Add Domain"
   - Enter: `yourdomain.com`
   - Add DNS records:
     ```
     Type: TXT
     Name: resend._domainkey
     Value: [provided by Resend]

     Type: MX
     Name: @
     Value: [provided by Resend]
     Priority: 10
     ```
   - Wait for verification (5-10 minutes)

4. Configure From Address:
   - Use `noreply@yourdomain.com` or `hello@yourdomain.com`
   - Must match verified domain

#### Environment Variables

```bash
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=PubWon
```

#### Pricing

| Plan | Monthly Emails | Price |
|------|---------------|-------|
| Free | 3,000 | $0 |
| Pro | 50,000 | $20/month |
| Business | 100,000 | $80/month |

#### Rate Limits

- Free: 100 emails/day, 3,000/month
- Pro: Rate limits increased based on plan

### Option 2: SendGrid (Alternative)

#### Overview
- **Best for**: Established businesses, advanced analytics
- **Pricing**: Free tier: 100 emails/day
- **Features**: Advanced analytics, A/B testing, marketing tools
- **Deliverability**: Industry standard

#### Setup Steps

1. Create SendGrid Account:
   - Navigate to https://signup.sendgrid.com/
   - Complete registration

2. Generate API Key:
   - Go to https://app.sendgrid.com/settings/api_keys
   - Click "Create API Key"
   - Name: "PubWon"
   - Permissions: Full Access (or "Restricted Access" with Mail Send only)
   - Copy key → `SENDGRID_API_KEY`

3. Verify Domain:
   - Go to https://app.sendgrid.com/settings/sender_auth
   - Click "Authenticate Your Domain"
   - Follow DNS setup instructions

4. Create Sender Identity:
   - Required for sending emails
   - Verify email address or domain

#### Environment Variables

```bash
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=PubWon
```

#### Pricing

| Plan | Monthly Emails | Price |
|------|---------------|-------|
| Free | 100/day | $0 |
| Essentials | 50,000 | $19.95/month |
| Pro | 100,000 | $89.95/month |

### Recommendation

**For MVP**: Use Resend
- Generous free tier
- Simpler API and setup
- Better developer experience
- Modern infrastructure
- React email template support

**Consider SendGrid for**:
- Existing SendGrid expertise
- Need for advanced marketing features
- A/B testing requirements
- Detailed analytics needs

### Email Client Setup

See `/src/lib/email.ts` for implementation.

---

## Stripe Setup

### Quick Reference

See Phase 1.3 documentation and `/src/lib/stripe.ts` for complete setup.

#### Products to Create in Stripe Dashboard

1. **Free Tier** (for tracking)
   - Price: $0/month
   - Features: 1 repository, 10 pain points/month

2. **Pro Monthly**
   - Price: $29/month
   - Features: 5 repositories, 100 pain points/month

3. **Pro Yearly**
   - Price: $290/year ($24.17/month, 17% savings)
   - Features: 5 repositories, 100 pain points/month

4. **Enterprise**
   - Price: Custom (start at $499/month)
   - Features: Unlimited everything

#### Environment Variables

```bash
STRIPE_SECRET_KEY=sk_test_your_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Price IDs (copy from Stripe Dashboard after creating products)
STRIPE_PRICE_ID_FREE=price_free_id
STRIPE_PRICE_ID_PRO_MONTHLY=price_monthly_id
STRIPE_PRICE_ID_PRO_YEARLY=price_yearly_id
STRIPE_PRICE_ID_ENTERPRISE=price_enterprise_id
```

---

## Security Best Practices

### 1. API Key Management

**DO**:
- Store all API keys in environment variables
- Use different keys for development/staging/production
- Rotate keys regularly (every 90 days)
- Use encrypted secret management (Vercel, AWS Secrets Manager)
- Set up key expiration where supported

**DON'T**:
- Commit API keys to version control
- Share API keys via Slack/email
- Use production keys in development
- Hardcode keys in source code

### 2. Webhook Security

**GitHub Webhooks**:
```typescript
import crypto from 'crypto';

function verifyGitHubWebhook(payload: string, signature: string): boolean {
  const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET!);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}
```

**Stripe Webhooks**:
```typescript
import { stripe } from '@/lib/stripe';

const event = stripe.webhooks.constructEvent(
  payload,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET!
);
```

### 3. Rate Limiting

Implement rate limiting for all external API calls:

```typescript
// src/lib/rate-limiter.ts
export class RateLimiter {
  private requests: number[] = [];

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  async checkLimit(): Promise<boolean> {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      return false; // Rate limit exceeded
    }

    this.requests.push(now);
    return true;
  }
}
```

### 4. Token Encryption

Encrypt sensitive tokens before storing in database:

```typescript
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

### 5. Environment Variable Validation

Validate all required environment variables at startup:

```typescript
// src/lib/env.ts
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'OPENAI_API_KEY',
  'RESEND_API_KEY',
] as const;

export function validateEnv() {
  const missing = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}
```

### 6. Error Handling

Never expose internal errors or API keys in error messages:

```typescript
export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    // Remove sensitive information from error messages
    return error.message.replace(/sk_[a-zA-Z0-9_]+/g, '[REDACTED]');
  }
  return 'An unexpected error occurred';
}
```

---

## Testing API Integrations

### 1. GitHub API Testing

```bash
# Test Personal Access Token
curl -H "Authorization: token YOUR_GITHUB_TOKEN" \
  https://api.github.com/user

# Test repository access
curl -H "Authorization: token YOUR_GITHUB_TOKEN" \
  https://api.github.com/repos/owner/repo
```

### 2. Reddit API Testing

```bash
# Get access token
curl -X POST -d "grant_type=password&username=YOUR_USERNAME&password=YOUR_PASSWORD" \
  --user "YOUR_CLIENT_ID:YOUR_CLIENT_SECRET" \
  https://www.reddit.com/api/v1/access_token

# Test subreddit access
curl -H "Authorization: bearer YOUR_ACCESS_TOKEN" \
  -A "YOUR_USER_AGENT" \
  https://oauth.reddit.com/r/programming/hot
```

### 3. OpenAI API Testing

```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### 4. Resend API Testing

```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "noreply@yourdomain.com",
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<p>Hello from Resend!</p>"
  }'
```

### 5. Stripe API Testing

```bash
# Test API key
curl https://api.stripe.com/v1/customers \
  -u YOUR_SECRET_KEY:

# Test webhook endpoint locally using Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## Monitoring and Logging

### 1. API Usage Tracking

Track API usage for cost monitoring:

```typescript
// src/lib/usage-tracker.ts
export async function trackAPIUsage(
  service: 'openai' | 'github' | 'reddit' | 'resend',
  operation: string,
  tokens?: number,
  cost?: number
) {
  await supabase.from('api_usage_logs').insert({
    service,
    operation,
    tokens,
    cost,
    timestamp: new Date().toISOString(),
  });
}
```

### 2. Error Monitoring

Use Sentry or similar for error tracking:

```bash
SENTRY_DSN=your_sentry_dsn
```

### 3. Rate Limit Monitoring

Log rate limit hits for optimization:

```typescript
export async function logRateLimitHit(
  service: string,
  endpoint: string
) {
  console.warn(`Rate limit hit: ${service} - ${endpoint}`);
  // Send alert or log to monitoring service
}
```

---

## Next Steps

1. Copy `.env.example` to `.env.local`
2. Fill in all API credentials from setup steps above
3. Run database migrations: `npm run db:migrate`
4. Test each API integration individually
5. Implement API client utilities in `/src/lib/`
6. Set up webhook endpoints in `/src/app/api/webhooks/`
7. Configure production environment variables in Vercel

---

## Support Resources

- **GitHub API**: https://docs.github.com/en/rest
- **Reddit API**: https://www.reddit.com/dev/api
- **OpenAI API**: https://platform.openai.com/docs
- **Anthropic API**: https://docs.anthropic.com
- **Resend Docs**: https://resend.com/docs
- **SendGrid Docs**: https://docs.sendgrid.com
- **Stripe Docs**: https://stripe.com/docs/api
