# PubWon - Customer Discovery Platform

Phase 4 Implementation: Reddit Analysis & GitHub Issue Creation

## Overview

This implementation provides a complete solution for automated customer discovery through Reddit analysis and GitHub issue creation. The system monitors subreddits, extracts pain points using AI, and creates actionable GitHub issues for product development.

## Features Implemented

### Phase 4.1: Reddit Scraping Service
- ✅ Reddit API client with intelligent rate limiting
- ✅ Scheduled job service for automated subreddit monitoring
- ✅ Top posts and comments fetching with configurable timeframes
- ✅ Relevance filtering and discussion storage
- ✅ Request queuing system to respect API limits

### Phase 4.2: Pain Point Extraction
- ✅ OpenAI GPT-4 powered pain point analysis
- ✅ Automatic categorization by theme (Performance, Usability, etc.)
- ✅ Severity ranking (low, medium, high, critical)
- ✅ Evidence extraction from discussions
- ✅ Duplicate detection and grouping
- ✅ Pain point review UI with approval/rejection workflow
- ✅ Database storage with full audit trail

### Phase 4.3: GitHub Issue Creation
- ✅ GitHub API integration with Octokit
- ✅ Automated issue creation from approved pain points
- ✅ Duplicate issue detection
- ✅ Bulk issue creation with progress tracking
- ✅ Custom labels (customer-discovery, severity-*, category)
- ✅ Structured issue templates with evidence
- ✅ Issue tracking in database

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Reddit Scraping Layer                     │
│  ┌────────────┐  ┌──────────────┐  ┌───────────────────┐   │
│  │   Reddit   │→ │ Rate Limiter │→ │ Discussion Store  │   │
│  │   Client   │  │  & Queuing   │  │   (Database)      │   │
│  └────────────┘  └──────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  AI Analysis Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ OpenAI GPT-4 │→ │  Pain Point  │→ │  Categorization  │  │
│  │   Analysis   │  │  Extraction  │  │   & Ranking      │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Review & Approval Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Pain Point  │→ │   Manual     │→ │  Approved Store  │  │
│  │  Review UI   │  │   Review     │  │   (Database)     │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                GitHub Integration Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   GitHub     │→ │  Duplicate   │→ │  Issue Tracker   │  │
│  │   API        │  │  Detection   │  │   (Database)     │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Reddit API credentials
- OpenAI API key
- GitHub personal access token

### Quick Start

1. Clone the repository and navigate to the project directory

2. Run the automated setup script:
```bash
./init.sh
```

The script will:
- Install all dependencies
- Create .env file from template
- Generate and run database migrations
- Execute test suite
- Verify setup completeness

3. Update the `.env` file with your credentials:
```env
# Reddit API
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=pubwon/1.0.0

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# GitHub
GITHUB_TOKEN=your_github_personal_access_token

# Database
DATABASE_URL=postgresql://user:password@host:5432/database
```

4. Start the development server:
```bash
npm run dev
```

## API Reference

### Pain Points API

#### GET /api/pain-points
Retrieve pain points with optional filtering.

Query Parameters:
- `icpPersonaId`: Filter by ICP persona
- `status`: Filter by status (pending, approved, rejected)

Response:
```json
{
  "painPoints": [
    {
      "id": "uuid",
      "title": "Performance issues with large datasets",
      "description": "Users experience slowdowns...",
      "category": "Performance",
      "severity": "high",
      "status": "pending",
      "createdAt": "2025-10-03T00:00:00Z"
    }
  ]
}
```

#### PATCH /api/pain-points
Update pain point status.

Request Body:
```json
{
  "id": "pain-point-uuid",
  "status": "approved"
}
```

### GitHub Issues API

#### POST /api/github/issues
Create GitHub issues from approved pain points.

Request Body:
```json
{
  "repositoryId": "repo-uuid",
  "painPointIds": ["pain-point-1", "pain-point-2"],
  "accessToken": "github-token"
}
```

Response:
```json
{
  "success": true,
  "stats": {
    "created": 5,
    "skipped": 2,
    "errors": 0
  },
  "message": "Created 5 issues, skipped 2, errors 0"
}
```

## Database Schema

### Key Tables

**subreddits**
- Stores monitored subreddit information
- Links to ICP personas
- Tracks relevance scores

**reddit_discussions**
- Raw discussion data from Reddit
- Post and comment content
- Metadata (score, author, timestamps)

**pain_points**
- Extracted pain points from discussions
- AI-generated categorization
- Review status tracking

**github_issues**
- Created GitHub issues
- Links to pain points
- Issue state tracking

## Usage Examples

### Manual Reddit Scraping

```typescript
import { redditScraper } from './lib/reddit-scraper';

// Scrape a specific subreddit
const discussions = await redditScraper.scrapeSubreddit(
  'javascript',
  'week',
  25
);

// Scrape all active subreddits
await redditScraper.scrapeAllActiveSubreddits();
```

### Pain Point Analysis

```typescript
import { painPointAnalyzer } from './lib/pain-point-analyzer';

// Analyze discussions
const analysis = await painPointAnalyzer.analyzeBatch(
  discussions,
  icpPersona
);

// Store extracted pain points
await painPointAnalyzer.storePainPoints(
  icpPersonaId,
  analysis.painPoints
);
```

### GitHub Issue Creation

```typescript
import { createGitHubClient } from './lib/github-client';

const githubClient = createGitHubClient(accessToken);

// Create issues from pain points
const stats = await githubClient.bulkCreateIssues(
  repositoryId,
  painPointIds
);
```

## Testing

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Test Coverage
The test suite includes:
- Reddit client rate limiting tests
- Pain point extraction and validation
- GitHub issue creation and formatting
- API endpoint integration tests
- Error handling and edge cases

## Rate Limiting

The system implements comprehensive rate limiting:

**Reddit API**
- 2 second delay between requests
- Request queuing system
- Automatic retry on rate limit errors
- Configurable request delays

**OpenAI API**
- 1 second delay between analysis requests
- Batch processing with delays
- Error handling and retries

**GitHub API**
- 1-1.5 second delays between operations
- Duplicate detection before creation
- Bulk operation support

## Error Handling

All services implement robust error handling:
- Graceful degradation on API failures
- Detailed error logging
- Transaction rollback on database errors
- User-friendly error messages
- Retry mechanisms for transient failures

## Security Considerations

- Environment variables for all API keys
- GitHub tokens stored securely
- SQL injection prevention with Drizzle ORM
- Input validation and sanitization
- Rate limiting to prevent abuse

## Performance Optimizations

- Database indexing on frequently queried fields
- Batch operations for bulk processing
- Caching of subreddit information
- Efficient duplicate detection
- Minimal API calls through intelligent queuing

## Monitoring & Logging

All operations include comprehensive logging:
- Reddit scraping progress
- AI analysis results
- GitHub issue creation status
- Error tracking and debugging
- Performance metrics

## Future Enhancements

Potential improvements for Phase 5+:
- Automated scheduling with cron jobs
- Webhook integration for real-time updates
- Advanced similarity matching for pain points
- Multi-language support
- Enhanced analytics dashboard
- Machine learning for relevance scoring

## Troubleshooting

### Common Issues

**Reddit API 429 Errors**
- Increase `REQUEST_DELAY` in reddit-client.ts
- Reduce batch sizes for scraping

**OpenAI Rate Limits**
- Add delays between analysis calls
- Use batch processing with smaller batches

**Database Connection Issues**
- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Ensure database exists

**GitHub Authentication Errors**
- Verify GITHUB_TOKEN has correct permissions
- Token needs repo and issue write access

## Contributing

Follow these guidelines:
1. Write tests for new features
2. Maintain TypeScript type safety
3. Add comprehensive error handling
4. Update documentation
5. Follow existing code style

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or contributions:
- Create GitHub issues
- Review existing documentation
- Check test files for usage examples
