# Deployment Guide

## Pre-Deployment Checklist

### 1. Database Setup

1. Create Supabase project at https://supabase.com
2. Navigate to SQL Editor in your Supabase dashboard
3. Copy contents of `supabase/schema.sql`
4. Paste and execute the SQL to create all tables and policies
5. Note your Supabase URL and keys from Project Settings > API

### 2. API Keys

Obtain the following API keys:

- **GitHub**:
  - Create OAuth App: https://github.com/settings/developers
  - Generate Personal Access Token with `repo` scope
  
- **OpenAI**:
  - Get API key from https://platform.openai.com/api-keys
  
- **Resend**:
  - Sign up at https://resend.com
  - Get API key from dashboard
  - Verify your sending domain

### 3. Vercel Deployment

1. Push your code to GitHub
2. Go to https://vercel.com and import your repository
3. Configure environment variables (see .env.example)
4. Deploy!

#### Environment Variables for Vercel

Copy all variables from `.env.example` and set them in Vercel:
- Supabase credentials
- GitHub OAuth and API tokens
- OpenAI API key
- Resend API key
- Generate a random string for CRON_SECRET

### 4. Cron Jobs Configuration

Cron jobs are automatically configured via `vercel.json`:
- Repository scanner runs daily at midnight UTC
- Content generator runs daily at 1 AM UTC

To secure cron endpoints, set CRON_SECRET environment variable in Vercel.

### 5. Domain Setup (Optional)

1. Add custom domain in Vercel dashboard
2. Update DNS records as instructed
3. Update NEXT_PUBLIC_APP_URL and RESEND_FROM_EMAIL

### 6. Post-Deployment

1. Test cron endpoints manually:
   ```bash
   curl -H "Authorization: Bearer YOUR_CRON_SECRET"      https://yourdomain.com/api/cron/scan-repositories
   ```

2. Subscribe to newsletter and verify email delivery

3. Publish a test blog post and verify SEO metadata

## Production Best Practices

### Security
- Keep service role key secret (server-side only)
- Rotate API keys regularly
- Monitor Supabase logs for unauthorized access
- Enable GitHub webhook secrets for production

### Performance
- Monitor Vercel analytics
- Set appropriate cache headers
- Use Vercel Edge Functions for global performance

### Monitoring
- Set up error tracking (Sentry recommended)
- Monitor email deliverability in Resend dashboard
- Track OpenAI API usage and costs
- Monitor database performance in Supabase

### Compliance
- Ensure CAN-SPAM compliance (unsubscribe links)
- Add privacy policy and terms of service
- Implement GDPR data export/deletion if serving EU users

## Troubleshooting

### Cron Jobs Not Running
- Verify CRON_SECRET is set in Vercel
- Check Vercel function logs
- Ensure cron jobs are enabled in Vercel project settings

### Email Not Sending
- Verify Resend API key
- Check domain verification status
- Review Resend logs for errors
- Ensure sender email matches verified domain

### Blog Posts Not Generating
- Verify OpenAI API key and credits
- Check repository activity significance threshold
- Review application logs for errors
- Ensure database connection is working

### Database Connection Issues
- Verify Supabase credentials
- Check RLS policies are correctly applied
- Ensure service role key is used for admin operations

## Scaling Considerations

### Database
- Monitor connection pool usage
- Add indexes as needed for query performance
- Consider connection pooling with Supabase

### Email
- Upgrade Resend plan as subscriber count grows
- Implement queue for large newsletter sends
- Monitor bounce rates and maintain list hygiene

### AI Generation
- Monitor OpenAI costs
- Implement caching for repeated requests
- Consider batch processing for efficiency

### Content Delivery
- Use Vercel Edge Network for global distribution
- Implement CDN for static assets
- Enable incremental static regeneration for blog pages
