# PubWon User Guide

Complete guide to using PubWon for customer discovery and automated content generation.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Onboarding](#onboarding)
3. [Dashboard Overview](#dashboard-overview)
4. [Repository Management](#repository-management)
5. [Pain Point Discovery](#pain-point-discovery)
6. [Content Generation](#content-generation)
7. [Email Subscribers](#email-subscribers)
8. [Subscription & Billing](#subscription--billing)
9. [Settings](#settings)
10. [FAQ](#faq)

## Getting Started

### Sign Up

1. Visit [app.pubwon.com](https://app.pubwon.com)
2. Click "Sign in with GitHub"
3. Authorize PubWon to access your GitHub account
4. Complete your profile information

### Initial Setup

After signing up, you'll be guided through a quick onboarding process:

1. **Connect Repository**: Select a GitHub repository to monitor
2. **ICP Generation**: AI analyzes your repository and generates an Ideal Customer Profile
3. **Subreddit Selection**: AI suggests relevant subreddits to monitor
4. **Confirmation**: Review and confirm your selections

## Onboarding

### Step 1: Repository Selection

Select the GitHub repository you want to monitor for:
- Development activity tracking
- Automated blog post generation
- Newsletter content creation

**Requirements**:
- You must have admin access to the repository
- Repository should have a README file
- Recent commit activity helps generate better ICPs

### Step 2: ICP Persona

The AI analyzes your repository to create an Ideal Customer Profile:

- **Demographics**: Target user characteristics
- **Goals**: What users want to achieve
- **Pain Points**: Problems they're trying to solve
- **Use Cases**: How they'll use your product

You can edit any of these fields before proceeding.

### Step 3: Subreddit Discovery

Based on your ICP, the AI suggests relevant subreddits to monitor:

- Review each suggested subreddit
- Add or remove subreddits manually
- At least one subreddit is required
- More subreddits = more pain point discovery

### Step 4: Confirmation

Review all your selections and click "Complete Setup" to start monitoring.

## Dashboard Overview

Your dashboard displays key metrics and recent activity:

### Metrics Cards

- **Pain Points Discovered**: Total pain points found from Reddit
- **GitHub Issues Created**: Issues created from pain points
- **Blog Posts Published**: Generated and published blog posts
- **Newsletter Subscribers**: Total email subscribers

### Activity Feed

Real-time feed of:
- New pain points discovered
- GitHub issues created
- Blog posts published
- Newsletters sent

### Quick Actions

- Generate new content
- Review pending pain points
- Manage subscribers
- View analytics

## Repository Management

### Connected Repository

View information about your connected repository:
- Repository name and description
- Last scan date
- Recent activity summary
- Content generation status

### Repository Settings

Configure how PubWon monitors your repository:

- **Scan Frequency**: How often to check for updates
- **Activity Threshold**: Minimum activity to trigger content generation
- **Notification Preferences**: When to notify you

### Disconnect Repository

To disconnect a repository:

1. Go to Settings → Repository
2. Click "Disconnect Repository"
3. Confirm the action

⚠️ **Warning**: Disconnecting removes:
- ICP persona
- Monitored subreddits
- Pending pain points
- Draft content

## Pain Point Discovery

### How It Works

1. PubWon scrapes your selected subreddits daily
2. AI analyzes discussions for customer pain points
3. Pain points are categorized and ranked
4. You review and approve relevant ones
5. Approved pain points become GitHub issues

### Review Pain Points

Navigate to Pain Points section to review discovered pain points:

Each pain point shows:
- **Title**: Brief description of the pain point
- **Description**: Detailed explanation
- **Category**: Performance, Usability, Documentation, etc.
- **Severity**: Low, Medium, High, Critical
- **Evidence**: Direct quotes from Reddit discussions
- **Source**: Link to original Reddit discussion

### Approve or Reject

For each pain point, you can:

- **Approve**: Marks pain point as relevant and ready to become an issue
- **Reject**: Dismisses pain point as not relevant
- **Edit**: Modify title or description before approving

### Create GitHub Issues

Once you have approved pain points:

1. Click "Create GitHub Issues"
2. Select which pain points to convert
3. Click "Create Issues"
4. Issues are created with:
   - Descriptive title
   - Detailed description
   - Evidence from discussions
   - Severity and category labels

## Content Generation

### Blog Post Generation

Blog posts are automatically generated when:
- Significant repository activity is detected
- At least 5 commits, or 1 PR merged, or 1 release published

Process:
1. Daily scan checks repository activity
2. If threshold met, AI generates blog post
3. Blog post appears in your dashboard as draft
4. You can edit before publishing

### Edit Blog Posts

Before publishing:

1. Review AI-generated content
2. Edit title, content, or excerpt
3. Add or modify code snippets
4. Update SEO metadata
5. Click "Publish" when ready

### Published Blog Posts

Published posts are:
- Hosted on your PubWon blog (`yourname.pubwon.com/blog`)
- Included in RSS feed
- Used for newsletter generation
- Shareable on social media

### Newsletter Generation

Newsletters are automatically generated from published blog posts:

1. Blog post is published
2. AI creates email-friendly version
3. Newsletter appears in your dashboard
4. You can edit before sending
5. Send to all subscribers with one click

## Email Subscribers

### Manage Subscribers

View all email subscribers:
- Email address
- Subscription date
- Status (Active, Pending, Unsubscribed)
- Source (Blog signup, newsletter opt-in)

### Import Subscribers

Bulk import subscribers:

1. Click "Import Subscribers"
2. Upload CSV file (email column required)
3. Review import preview
4. Confirm import

**Note**: Imported subscribers receive confirmation email per CAN-SPAM requirements.

### Export Subscribers

Export your subscriber list:

1. Click "Export Subscribers"
2. Select format (CSV, JSON)
3. Download file

### Subscriber Widget

Add subscription form to your website:

```html
<script src="https://app.pubwon.com/widgets/subscribe.js"></script>
<div class="pubwon-subscribe" data-repo="your-repo-id"></div>
```

## Subscription & Billing

### Plans

**Free Plan**:
- 1 repository
- 5 subreddits
- 10 pain points/month
- 4 blog posts/month
- 100 email subscribers

**Pro Plan ($29/month)**:
- 5 repositories
- Unlimited subreddits
- Unlimited pain points
- Unlimited blog posts
- 1,000 email subscribers
- Priority support

**Enterprise Plan (Custom)**:
- Unlimited everything
- Custom integrations
- Dedicated support
- SLA guarantees

### Upgrade

To upgrade your plan:

1. Go to Settings → Billing
2. Click "Upgrade Plan"
3. Select desired plan
4. Enter payment information
5. Confirm subscription

### Manage Billing

View and manage:
- Current plan details
- Usage statistics
- Payment method
- Billing history
- Invoices

### Cancel Subscription

To cancel:

1. Go to Settings → Billing
2. Click "Cancel Subscription"
3. Select cancellation reason (optional)
4. Confirm cancellation

Your subscription remains active until the end of the billing period.

## Settings

### Profile

Update your profile information:
- Email address
- Display name
- Avatar
- Bio

### Notifications

Configure notification preferences:
- Email notifications for new pain points
- Digest frequency (daily, weekly)
- Content generation alerts
- Subscriber milestones

### API Access

Generate API keys for programmatic access:

1. Go to Settings → API
2. Click "Generate API Key"
3. Name your key
4. Copy and save securely

⚠️ **Security**: Never share your API keys. Rotate keys regularly.

### Data & Privacy

Manage your data:
- **Export Data**: Download all your data (GDPR compliance)
- **Delete Account**: Permanently delete account and data
- **Privacy Settings**: Control data sharing preferences

### Support

Access support resources:
- Documentation
- Video tutorials
- Contact support
- Feature requests

## FAQ

### How often does PubWon check my repository?

Once per day by default. You can configure this in Repository Settings.

### Can I monitor multiple repositories?

Yes, with the Pro plan you can monitor up to 5 repositories.

### How many subreddits can I monitor?

Free plan: 5 subreddits
Pro plan: Unlimited subreddits

### Can I edit AI-generated content?

Yes, all generated content (blog posts, newsletters) can be edited before publishing.

### What happens to my data if I cancel?

Your data is retained for 30 days after cancellation, then permanently deleted.

### Can I import my existing email list?

Yes, use the Import Subscribers feature. Imported subscribers must confirm their subscription.

### How do I add a subscription form to my website?

Use our embeddable widget code found in Settings → Email Subscribers.

### What if the AI generates irrelevant pain points?

Simply reject them. The AI learns from your approvals/rejections to improve over time.

### Can I customize the GitHub issue format?

Not currently, but this is on our roadmap. Contact support if you need custom formatting.

### How do I get help?

- Check this user guide
- Visit our documentation
- Email support@pubwon.com
- Use in-app chat support (Pro plan)

### Is my GitHub token secure?

Yes, tokens are encrypted at rest and never exposed. We only request the minimum permissions needed.

### Can I pause content generation temporarily?

Yes, go to Settings → Repository and toggle "Pause Content Generation".

### What happens if I hit my plan limits?

You'll be notified when approaching limits. Operations pause when limits are reached until next billing cycle or you upgrade.

## Tips & Best Practices

### Maximizing Pain Point Discovery

1. Select highly active subreddits
2. Choose subreddits where your ICP is active
3. Review pain points regularly
4. Provide feedback (approve/reject) consistently

### Content Generation

1. Keep consistent commit activity
2. Write descriptive commit messages
3. Use pull requests for major features
4. Create releases for version milestones

### Growing Your Email List

1. Embed subscription widget on your site
2. Promote newsletter in blog posts
3. Share valuable content consistently
4. Engage with subscribers

### Best Results

- Complete onboarding thoroughly
- Review generated content before publishing
- Engage with discovered pain points promptly
- Monitor analytics to understand what resonates

## Need More Help?

- 📧 Email: support@pubwon.com
- 💬 Live Chat: Available in app (Pro users)
- 📚 Documentation: docs.pubwon.com
- 🎥 Video Tutorials: youtube.com/pubwon
