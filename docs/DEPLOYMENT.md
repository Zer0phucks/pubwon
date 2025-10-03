# Production Deployment Guide

Comprehensive checklist and guide for deploying PubWon to production.

## Pre-Launch Checklist

### Security ✅

- [ ] All environment variables set in production
- [ ] API keys rotated from development values
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] Content Security Policy headers configured
- [ ] Rate limiting enabled on all API routes
- [ ] CSRF protection enabled
- [ ] Input sanitization implemented
- [ ] SQL injection prevention verified (using Drizzle ORM)
- [ ] XSS protection enabled
- [ ] Webhook signature verification implemented
- [ ] Secrets encrypted in database
- [ ] Security headers configured (X-Frame-Options, etc.)

### Database 📊

- [ ] Production database created and configured
- [ ] All migrations applied
- [ ] Database backups configured
- [ ] Row Level Security (RLS) policies enabled
- [ ] Database indexes created
- [ ] Connection pooling configured
- [ ] Database monitoring enabled

### External Services 🔌

- [ ] **GitHub OAuth**: Production app created and configured
- [ ] **Reddit API**: Production credentials obtained
- [ ] **OpenAI API**: Production key with billing set up
- [ ] **Stripe**: Production keys configured
- [ ] **Resend**: Domain verified, SPF/DKIM configured
- [ ] **Supabase**: Production project created
- [ ] All API rate limits understood and monitored

### Payment & Billing 💳

- [ ] Stripe products and prices created
- [ ] Webhook endpoints configured
- [ ] Test payments completed successfully
- [ ] Subscription flows tested (create, upgrade, cancel)
- [ ] Failed payment handling tested
- [ ] Refund process verified
- [ ] Tax calculations configured (if applicable)
- [ ] Invoice generation tested

### Email Deliverability 📧

- [ ] Domain ownership verified in Resend
- [ ] SPF record added to DNS
- [ ] DKIM record added to DNS
- [ ] DMARC policy configured
- [ ] Test emails delivered successfully
- [ ] Unsubscribe links working
- [ ] Email templates reviewed
- [ ] Physical address added to emails (CAN-SPAM)
- [ ] Bounce handling configured
- [ ] Complaint handling configured

### Content & Legal 📄

- [ ] Privacy Policy published and linked
- [ ] Terms of Service published and linked
- [ ] Cookie Consent banner implemented
- [ ] GDPR compliance verified
  - [ ] Data export functionality
  - [ ] Data deletion functionality
  - [ ] Privacy policy acceptance tracking
- [ ] CAN-SPAM compliance verified
  - [ ] Unsubscribe in all emails
  - [ ] Physical address in all emails
  - [ ] Double opt-in for subscriptions

### Performance ⚡

- [ ] Database queries optimized
- [ ] API response times < 200ms (95th percentile)
- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] Caching strategy configured
- [ ] CDN configured (Vercel Edge)
- [ ] Lighthouse score > 90
- [ ] Core Web Vitals optimized

### Monitoring & Observability 📊

- [ ] Error tracking configured (Sentry)
- [ ] Application logging implemented
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring configured
- [ ] Critical alerts set up
  - [ ] API errors > 5% in 5 minutes
  - [ ] Database connection failures
  - [ ] Payment failures
  - [ ] Email delivery failures
- [ ] Log aggregation configured
- [ ] Metrics dashboard created

### Testing ✅

- [ ] Unit tests passing (coverage > 70%)
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Load testing completed
- [ ] Security scan completed
- [ ] Accessibility testing completed (WCAG AA)
- [ ] Cross-browser testing completed
- [ ] Mobile responsiveness verified

### SEO & Analytics 🔍

- [ ] Meta tags configured
- [ ] Open Graph tags added
- [ ] Twitter Card tags added
- [ ] Sitemap generated
- [ ] Robots.txt configured
- [ ] Analytics implemented (optional)
- [ ] Google Search Console configured (optional)

### User Experience 🎨

- [ ] 404 page implemented
- [ ] 500 error page implemented
- [ ] Loading states implemented
- [ ] Error messages user-friendly
- [ ] Success messages implemented
- [ ] Mobile UI tested
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility verified

### Documentation 📚

- [ ] README updated
- [ ] User guide created
- [ ] API documentation published
- [ ] Troubleshooting guide created
- [ ] Architecture documentation updated
- [ ] Changelog started

### Backup & Recovery 💾

- [ ] Database backup strategy implemented
- [ ] Backup restoration tested
- [ ] Disaster recovery plan documented
- [ ] Data retention policy documented
- [ ] Recovery time objective (RTO) defined
- [ ] Recovery point objective (RPO) defined

## Deployment Steps

### 1. Prepare Environment Variables

Create production environment variables in Vercel:

```bash
# Navigate to Vercel Dashboard > Project > Settings > Environment Variables
# Add all variables from .env.example
```

Required variables:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- GITHUB_CLIENT_ID
- GITHUB_CLIENT_SECRET
- REDDIT_CLIENT_ID
- REDDIT_CLIENT_SECRET
- OPENAI_API_KEY
- STRIPE_SECRET_KEY
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- STRIPE_WEBHOOK_SECRET
- RESEND_API_KEY
- RESEND_FROM_EMAIL
- NEXT_PUBLIC_APP_URL

### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

Or push to main branch for automatic deployment (if connected to GitHub).

### 3. Configure DNS

After deployment:

1. Add custom domain in Vercel
2. Configure DNS records as instructed
3. Wait for DNS propagation (up to 48 hours)
4. Verify HTTPS certificate is issued

### 4. Database Migration

```bash
# Run migrations on production database
npm run db:migrate

# Verify tables created correctly
npm run db:studio
```

### 5. Configure Webhooks

#### Stripe Webhooks

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook signing secret to environment variables

#### GitHub Webhooks (optional)

1. Go to repository > Settings > Webhooks
2. Add webhook: `https://yourdomain.com/api/webhooks/github`
3. Select events: `push`, `pull_request`, `release`
4. Add secret token

### 6. Configure Cron Jobs

Vercel cron jobs are configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/scan-repositories",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/generate-content",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/scrape-reddit",
      "schedule": "0 4 * * *"
    }
  ]
}
```

### 7. Verify Production

Test critical flows:

1. **Authentication**: Sign up, login, logout
2. **Repository**: Connect, disconnect repository
3. **Pain Points**: View, approve, reject
4. **GitHub Issues**: Create issues from pain points
5. **Blog**: Generate, edit, publish
6. **Newsletter**: Generate, edit, send
7. **Subscription**: Subscribe, update payment, cancel
8. **Email**: Subscribe, confirm, unsubscribe

### 8. Enable Monitoring

1. Configure Sentry error tracking
2. Set up uptime monitoring (UptimeRobot, Pingdom)
3. Configure alerts for critical failures
4. Set up status page (optional)

### 9. Backup Strategy

Configure automated backups:

1. Supabase: Enable automatic backups
2. Set backup retention period (30 days recommended)
3. Test backup restoration
4. Document recovery procedures

## Post-Deployment

### Week 1

- [ ] Monitor error rates closely
- [ ] Check performance metrics
- [ ] Verify email deliverability
- [ ] Monitor payment processing
- [ ] Collect initial user feedback

### Week 2-4

- [ ] Analyze usage patterns
- [ ] Optimize based on real data
- [ ] Fix any issues discovered
- [ ] Improve documentation based on support requests

### Ongoing

- [ ] Weekly security updates
- [ ] Monthly dependency updates
- [ ] Quarterly security audits
- [ ] Regular backup testing
- [ ] Performance optimization

## Rollback Procedure

If critical issues are discovered:

1. Identify the last working deployment
2. Rollback via Vercel Dashboard or CLI:
   ```bash
   vercel rollback [deployment-url]
   ```
3. Investigate and fix issue in development
4. Test thoroughly before redeploying
5. Document incident and resolution

## Monitoring Alerts

Configure alerts for:

### Critical (Immediate Response)

- Database connection failures
- API error rate > 5% in 5 minutes
- Payment processing failures
- Email delivery failure rate > 10%

### Warning (Response within 1 hour)

- API response time > 1 second (95th percentile)
- Disk usage > 80%
- Memory usage > 80%
- Rate limit hit frequency increasing

### Info (Review daily)

- Failed login attempts spike
- New user signups
- Subscription changes
- Content generation volume

## Security Monitoring

Monitor for:

- Unusual API access patterns
- Failed authentication attempts
- Rate limit violations
- Suspicious payment activity
- Data export requests

## Performance Benchmarks

Target metrics:

- **API Response Time**: < 200ms (p95)
- **Database Query Time**: < 50ms (p95)
- **Page Load Time**: < 2s (p95)
- **Time to Interactive**: < 3s
- **Uptime**: 99.9%
- **Error Rate**: < 0.1%

## Support Preparation

Before launch:

1. Create support email account
2. Set up support ticket system (optional)
3. Prepare FAQ based on testing
4. Train support team (if applicable)
5. Document common issues and solutions

## Marketing Preparation

- [ ] Landing page finalized
- [ ] Product screenshots ready
- [ ] Demo video created
- [ ] Launch announcement prepared
- [ ] Social media posts scheduled
- [ ] Product Hunt submission ready (optional)

## Legal Compliance

- [ ] Privacy policy reviewed by legal (recommended)
- [ ] Terms of service reviewed by legal (recommended)
- [ ] GDPR compliance verified (if serving EU users)
- [ ] CAN-SPAM compliance verified
- [ ] Data processing agreements in place (if applicable)

## Final Pre-Launch Check

24 hours before launch:

- [ ] All checklist items completed
- [ ] Team briefed on launch plan
- [ ] Support channels ready
- [ ] Monitoring dashboards reviewed
- [ ] Rollback procedure tested
- [ ] Backup verified
- [ ] Performance tested under load

## Launch Day

- [ ] Deploy to production
- [ ] Verify all systems operational
- [ ] Monitor errors and performance closely
- [ ] Be available for immediate support
- [ ] Announce launch on planned channels

## Post-Launch Review

After 48 hours:

- [ ] Review error logs
- [ ] Analyze user behavior
- [ ] Check performance metrics
- [ ] Review feedback received
- [ ] Document lessons learned
- [ ] Plan immediate improvements

## Emergency Contacts

Document emergency contacts:

- Database admin
- Hosting provider support
- Payment processor support
- Email service support
- GitHub support
- Team on-call rotation

## Success Metrics

Track these metrics post-launch:

- User signups
- Activation rate (completed onboarding)
- Retention rate (30-day)
- Pain points discovered
- GitHub issues created
- Blog posts published
- Newsletter open rate
- Subscription conversion rate
- Customer support tickets

## Conclusion

Thorough preparation ensures a smooth launch. Review this checklist carefully and don't rush to production. It's better to delay launch than to launch with critical issues.

Good luck with your launch! 🚀
