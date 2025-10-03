# Customer Discovery & Development App - Task Breakdown

## Project Overview
App to help founders integrate customer discovery into development cycle via GitHub integration, Reddit analysis, automated content generation, and newsletter distribution.

**Tech Stack**: Next.js + Vercel + Supabase (DB + Auth) + Stripe + GitHub API + Reddit API

---

## Phase 1: Project Setup & Infrastructure

### 1.1 Initial Setup
- [x] Initialize Next.js 14+ project with TypeScript
- [x] Configure ESLint and Prettier
- [x] Set up Git repository
- [x] Create `.env.example` with all required environment variables
- [x] Set up project structure (app/, components/, lib/, types/)

### 1.2 Supabase Configuration
- [x] Create Supabase project
- [x] Configure authentication providers (GitHub OAuth)
- [x] Design database schema
  - [x] users table
  - [x] repositories table
  - [x] icp_personas table
  - [x] subreddits table
  - [x] pain_points table
  - [x] github_issues table
  - [x] blog_posts table
  - [x] newsletters table
  - [x] email_subscribers table
- [x] Set up Row Level Security (RLS) policies
- [x] Create database migrations
- [x] Configure Supabase client in Next.js

### 1.3 Stripe Integration
- [x] Create Stripe account and get API keys
- [x] Set up Stripe products and pricing plans
- [x] Configure Stripe webhooks
- [x] Create subscription management tables in Supabase
  - [x] subscriptions table
  - [x] stripe_customers table
- [x] Implement Stripe webhook handler

### 1.4 External APIs Setup
- [x] Register GitHub OAuth App
- [x] Set up GitHub API access and webhooks
- [x] Get Reddit API credentials
- [x] Research and select AI API (OpenAI/Anthropic) for content generation
- [x] Set up email service provider (Resend/SendGrid)

### 1.5 Deployment Configuration
- [x] Create Vercel project
- [x] Configure environment variables in Vercel
- [x] Set up preview deployments
- [x] Configure custom domain (if applicable)

---

## Phase 2: Authentication & User Management

### 2.1 Authentication Flow
- [x] Implement Supabase Auth UI components
- [x] Create login page with GitHub OAuth
- [x] Implement session management
- [x] Create protected route middleware
- [x] Add logout functionality
- [x] Handle authentication errors

### 2.2 User Profile & Settings
- [x] Create user profile page
- [x] Implement profile update functionality
- [x] Add email preferences management
- [x] Create subscription status display
- [x] Implement account deletion flow

---

## Phase 3: Onboarding & GitHub Integration

### 3.1 GitHub Connection
- [x] Create GitHub OAuth callback handler
- [x] Store GitHub access tokens securely (encrypted)
- [x] Fetch user's GitHub repositories
- [x] Create repository selection UI
- [x] Save selected repository to database

### 3.2 Repository Analysis
- [x] Implement GitHub repository scanner
  - [x] Fetch README.md
  - [x] Analyze package.json/requirements.txt/etc
  - [x] Scan code structure and primary languages
  - [x] Extract project description and purpose
- [x] Create repository analysis service
- [x] Generate structured repository summary

### 3.3 ICP Persona Generation
- [x] Design ICP persona data structure
- [x] Implement AI-powered persona generation
  - [x] Use repository analysis as input
  - [x] Generate demographics
  - [x] Identify user goals and motivations
  - [x] Define pain points and challenges
  - [x] Create use cases
- [x] Create ICP persona display UI
- [x] Add persona editing capability
- [x] Store persona in database

### 3.4 Subreddit Identification
- [x] Implement subreddit discovery algorithm
  - [x] Use ICP persona as input
  - [x] Search Reddit for relevant communities
  - [x] Rank subreddits by relevance
  - [x] Validate subreddit activity levels
- [x] Create subreddit selection UI
- [x] Allow manual subreddit addition/removal
- [x] Store selected subreddits in database

---

## Phase 4: Reddit Analysis & Issue Generation

### 4.1 Reddit Scraping Service
- [x] Implement Reddit API client
- [x] Create scheduled job for subreddit monitoring
- [x] Fetch top posts and comments from selected subreddits
- [x] Filter discussions by relevance
- [x] Store raw discussion data

### 4.2 Pain Point Extraction
- [x] Implement AI-powered pain point analysis
  - [x] Extract problems and frustrations from discussions
  - [x] Categorize pain points by theme
  - [x] Rank by frequency and severity
  - [x] Link pain points to ICP persona
- [x] Create pain point review UI
- [x] Allow manual approval/rejection of pain points
- [x] Store approved pain points in database

### 4.3 GitHub Issue Creation
- [x] Implement GitHub API issue creation
- [x] Map pain points to GitHub issues
  - [x] Generate issue title and description
  - [x] Add relevant labels
  - [x] Assign to appropriate repository
- [x] Create issue preview UI
- [x] Implement bulk issue creation
- [x] Track created issues in database
- [x] Handle duplicate detection

---

## Phase 5: Repository Monitoring & Content Generation

### 5.1 Daily Repository Scanner
- [x] Create scheduled job (Vercel Cron)
- [x] Implement GitHub activity monitoring
  - [x] Fetch commits since last check
  - [x] Fetch merged pull requests
  - [x] Fetch closed issues
  - [x] Fetch releases/tags
- [x] Determine if changes are significant enough for content
- [x] Store activity summary in database

### 5.2 Blog Post Generation
- [x] Implement AI-powered blog post generator
  - [x] Use repository activity as input
  - [x] Generate engaging title
  - [x] Create structured content (intro, features, technical details, conclusion)
  - [x] Add relevant code snippets/examples
  - [x] Generate SEO metadata
- [x] Create blog post editor UI
- [x] Allow manual editing before publishing
- [x] Store blog posts in database

### 5.3 Blog Publishing
- [x] Create blog hosting pages in Next.js
- [x] Implement blog post display with syntax highlighting
- [x] Add blog listing page
- [x] Create RSS feed
- [x] Implement SEO optimization
- [x] Add social sharing features

### 5.4 Newsletter Generation
- [x] Implement AI-powered newsletter generator
  - [x] Use repository activity and blog post as input
  - [x] Create email-friendly HTML template
  - [x] Generate subject line
  - [x] Add personalization tokens
- [x] Create newsletter preview UI
- [x] Allow manual editing before sending
- [x] Store newsletters in database

### 5.5 Email Distribution
- [x] Implement email service integration (Resend/SendGrid)
- [x] Create email subscriber management
  - [x] Subscription form
  - [x] Double opt-in confirmation
  - [x] Unsubscribe handling
- [x] Implement bulk email sending
- [x] Track email delivery status
- [x] Handle bounces and complaints
- [x] Add email analytics (opens, clicks)

---

## Phase 6: Dashboard & Analytics

### 6.1 Main Dashboard
- [x] Create dashboard layout
- [x] Display repository overview
- [x] Show ICP persona summary
- [x] List monitored subreddits
- [x] Display recent pain points discovered
- [x] Show GitHub issues created
- [x] Display blog posts published
- [x] Show newsletter statistics

### 6.2 Analytics
- [x] Implement pain point analytics
  - [x] Pain points over time
  - [x] Categories distribution
  - [x] Source subreddit breakdown
- [x] Create blog post analytics
  - [x] Views over time
  - [x] Popular posts
  - [x] Traffic sources
- [x] Implement newsletter analytics
  - [x] Subscriber growth
  - [x] Open rates
  - [x] Click-through rates
- [x] Add GitHub issue analytics
  - [x] Issues created vs. closed
  - [x] Issue categories

### 6.3 Activity Feed
- [x] Create real-time activity log
- [x] Display recent system actions
- [x] Show processing status for background jobs
- [x] Add filtering and search

---

## Phase 7: Subscription & Billing

### 7.1 Pricing Page
- [x] Create pricing tiers
  - [x] Free tier (limited features)
  - [x] Pro tier (full features)
  - [x] Enterprise tier (custom)
- [x] Design pricing page UI
- [x] Implement feature comparison table

### 7.2 Checkout Flow
- [x] Create Stripe Checkout integration
- [x] Implement subscription creation
- [x] Handle payment success/failure
- [x] Send confirmation emails
- [x] Grant access to paid features

### 7.3 Subscription Management
- [x] Create billing portal integration
- [x] Implement plan upgrade/downgrade
- [x] Handle subscription cancellation
- [x] Implement grace periods
- [x] Handle failed payments

### 7.4 Usage Limits
- [x] Implement feature gating by plan
- [x] Track usage metrics
  - [x] Repositories monitored
  - [x] Pain points extracted per month
  - [x] Blog posts generated per month
  - [x] Newsletter sends per month
- [x] Display usage on dashboard
- [x] Implement soft/hard limits
- [x] Add upgrade prompts

---

## Phase 8: Background Jobs & Automation

### 8.1 Job Scheduler Setup
- [x] Configure Vercel Cron or external scheduler (Inngest/QStash)
- [x] Create job monitoring system
- [x] Implement error handling and retry logic
- [x] Add job logging

### 8.2 Scheduled Jobs
- [x] Daily repository scanner job
- [x] Weekly subreddit analysis job
- [x] Daily blog post generation job (if changes detected)
- [x] Newsletter sending job (if content available)
- [x] Subscription status check job
- [x] Database cleanup job (old data)

### 8.3 Webhook Handlers
- [x] GitHub webhook handler (push, PR, issues)
- [x] Stripe webhook handler (payment events)
- [x] Email webhook handler (bounces, opens, clicks)

---

## Phase 9: User Experience & Polish

### 9.1 Onboarding Flow
- [x] Create multi-step onboarding wizard
- [x] Add progress indicators
- [x] Implement step validation
- [x] Add skip options for optional steps
- [x] Create onboarding completion celebration

### 9.2 Notifications
- [x] Implement in-app notification system
- [x] Add email notifications for key events
  - [x] New pain points discovered
  - [x] Blog post published
  - [x] Newsletter sent
  - [x] Subscription changes
- [x] Create notification preferences

### 9.3 Settings & Preferences
- [x] Create comprehensive settings page
- [x] Add repository settings
- [x] Configure subreddit preferences
- [x] Set content generation preferences
- [x] Configure notification settings
- [x] Add AI model selection (if multiple options)

### 9.4 UI/UX Improvements
- [x] Implement loading states
- [x] Add skeleton screens
- [x] Create error boundaries
- [x] Add toast notifications
- [x] Implement optimistic UI updates
- [x] Add animations and transitions
- [x] Ensure mobile responsiveness

---

## Phase 10: Testing & Quality Assurance

### 10.1 Unit Tests
- [x] Test utility functions
- [x] Test API route handlers
- [x] Test database operations
- [x] Test AI generation functions
- [x] Test email sending logic

### 10.2 Integration Tests
- [x] Test GitHub OAuth flow
- [x] Test repository analysis pipeline
- [x] Test Reddit scraping and analysis
- [x] Test blog post generation and publishing
- [x] Test newsletter generation and sending
- [x] Test Stripe subscription flow

### 10.3 E2E Tests
- [x] Test complete onboarding flow
- [x] Test repository connection and analysis
- [x] Test pain point to issue flow
- [x] Test content generation pipeline
- [x] Test subscription management

### 10.4 Performance Testing
- [x] Test with large repositories
- [x] Test with multiple subreddits
- [x] Test batch operations
- [x] Optimize database queries
- [x] Implement caching where appropriate

---

## Phase 11: Security & Compliance

### 11.1 Security Hardening
- [x] Implement rate limiting
- [x] Add CSRF protection
- [x] Sanitize user inputs
- [x] Implement API key rotation
- [x] Secure webhook endpoints
- [x] Add database encryption for sensitive data
- [x] Implement audit logging

### 11.2 Privacy & Compliance
- [x] Create privacy policy
- [x] Create terms of service
- [x] Implement GDPR compliance
  - [x] Data export functionality
  - [x] Data deletion functionality
  - [x] Cookie consent
- [x] Add CAN-SPAM compliance for emails
- [x] Implement data retention policies

---

## Phase 12: Documentation & Launch

### 12.1 Documentation
- [x] Write comprehensive README
- [x] Create API documentation (if exposing API)
- [x] Write user guide
- [x] Create video tutorials
- [x] Document architecture and design decisions
- [x] Create troubleshooting guide

### 12.2 Monitoring & Observability
- [x] Set up error tracking (Sentry)
- [x] Implement application logging
- [x] Add performance monitoring
- [x] Create uptime monitoring
- [x] Set up alerts for critical failures

### 12.3 Pre-Launch Checklist
- [x] Review all security measures
- [x] Test all payment flows
- [x] Verify email deliverability
- [x] Check mobile responsiveness
- [x] Validate API rate limits
- [x] Test backup and recovery procedures
- [x] Review terms and privacy policies

### 12.4 Launch
- [x] Deploy to production
- [x] Configure production environment variables
- [x] Set up DNS and SSL
- [x] Enable monitoring and alerts
- [ ] Announce launch
- [ ] Monitor initial user feedback

---

## Phase 13: Post-Launch Iteration

### 13.1 User Feedback
- [ ] Implement feedback collection system
- [ ] Monitor user behavior analytics
- [ ] Conduct user interviews
- [ ] Track feature requests

### 13.2 Optimization
- [ ] Optimize AI prompts based on output quality
- [ ] Improve pain point extraction accuracy
- [ ] Enhance blog post quality
- [ ] Refine newsletter content
- [ ] Optimize job execution times

### 13.3 New Features
- [ ] Support for multiple repositories
- [ ] Custom subreddit suggestion algorithm
- [ ] AI model selection
- [ ] Blog post scheduling
- [ ] A/B testing for newsletters
- [ ] Integration with other platforms (Twitter, LinkedIn)
- [ ] Team collaboration features
- [ ] Webhook API for integrations

---

## Estimated Timeline

- **Phase 1-2**: 1 week (Setup & Auth)
- **Phase 3-4**: 2-3 weeks (Onboarding & Reddit Analysis)
- **Phase 5**: 2-3 weeks (Content Generation)
- **Phase 6-7**: 1-2 weeks (Dashboard & Billing)
- **Phase 8**: 1 week (Automation)
- **Phase 9-10**: 2 weeks (Polish & Testing)
- **Phase 11-12**: 1 week (Security & Launch)

**Total Estimated Time**: 10-14 weeks for MVP

---

## Priority Levels

**P0 (Critical - MVP)**: Phases 1-5, 7.1-7.2, 8.1-8.2
**P1 (Important - Post-MVP)**: Phases 6, 7.3-7.4, 8.3, 9
**P2 (Nice to Have)**: Phases 10-13

---

## Key Dependencies

1. **GitHub API**: Repository access, issue creation, webhooks
2. **Reddit API**: Subreddit data, post/comment access
3. **AI API**: OpenAI GPT-4 or Anthropic Claude for content generation
4. **Email Service**: Resend or SendGrid for transactional and bulk emails
5. **Supabase**: Database, authentication, realtime subscriptions
6. **Stripe**: Payment processing and subscription management
7. **Vercel**: Hosting, serverless functions, cron jobs
