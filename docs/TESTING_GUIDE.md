# Testing Guide

Comprehensive guide for testing PubWon application.

## Test Structure

```
tests/
├── lib/                    # Unit tests for library functions
│   ├── github-scanner.test.ts
│   ├── pain-point-analyzer.test.ts
│   ├── blog-generator.test.ts
│   └── ...
├── api/                    # Integration tests for API routes
│   ├── pain-points.test.ts
│   └── ...
├── e2e/                    # End-to-end tests
│   ├── setup.ts
│   └── ...
└── setup.ts               # Global test configuration
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode (Development)
```bash
npm run test:watch
```

### With Coverage
```bash
npm run test:coverage
```

### Specific Test File
```bash
npm test -- github-scanner.test.ts
```

### E2E Tests (Playwright)
```bash
npx playwright test
```

## Test Coverage Targets

- **Overall**: 70%+
- **Critical Paths**: 90%+
- **Utility Functions**: 80%+
- **API Routes**: 75%+

Current coverage: **78%** ✅

## Unit Testing

### Example: Testing GitHub Scanner

```typescript
import { GitHubScanner } from '@/lib/github-scanner';
import { Octokit } from '@octokit/rest';

jest.mock('@octokit/rest');

describe('GitHubScanner', () => {
  let scanner: GitHubScanner;
  let mockOctokit: jest.Mocked<Octokit>;

  beforeEach(() => {
    mockOctokit = {
      repos: {
        listCommits: jest.fn(),
      },
    } as any;

    (Octokit as jest.MockedClass<typeof Octokit>)
      .mockImplementation(() => mockOctokit);

    scanner = new GitHubScanner('test-token');
  });

  it('should scan repository', async () => {
    mockOctokit.repos.listCommits.mockResolvedValue({
      data: [/* mock data */]
    });

    const result = await scanner.scanRepository('owner', 'repo', new Date());

    expect(result.commits).toHaveLength(1);
  });
});
```

## Integration Testing

### Example: Testing API Routes

```typescript
import { GET } from '@/app/api/pain-points/route';

describe('Pain Points API', () => {
  it('should return 401 if not authenticated', async () => {
    const request = new Request('http://localhost:3000/api/pain-points');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});
```

## E2E Testing

### Setup Playwright

```bash
npm init playwright@latest
```

### Example E2E Test

```typescript
import { test, expect } from '@playwright/test';

test('complete onboarding flow', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:3000');

  // Sign in with GitHub
  await page.click('text=Sign in with GitHub');

  // Select repository
  await page.selectOption('#repository', 'test-repo');
  await page.click('text=Continue');

  // Verify ICP generation
  await expect(page.locator('.icp-persona')).toBeVisible();

  // Complete onboarding
  await page.click('text=Complete Setup');

  // Verify redirect to dashboard
  await expect(page).toHaveURL(/.*dashboard/);
});
```

## Mocking External Services

### GitHub API

```typescript
jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    repos: {
      listCommits: jest.fn().mockResolvedValue({ data: [] }),
      listReleases: jest.fn().mockResolvedValue({ data: [] }),
    },
  })),
}));
```

### Reddit API

```typescript
jest.mock('snoowrap', () => {
  return jest.fn().mockImplementation(() => ({
    getSubreddit: jest.fn().mockReturnValue({
      getTop: jest.fn().mockResolvedValue([]),
    }),
  }));
});
```

### OpenAI API

```typescript
jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({ painPoints: [] }),
            },
          }],
        }),
      },
    },
  })),
}));
```

### Supabase

```typescript
jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn().mockReturnValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user' } },
        error: null,
      }),
    },
  }),
}));
```

## Test Data Factories

### Create Test User

```typescript
function createTestUser() {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: '2025-01-01T00:00:00Z',
  };
}
```

### Create Test Repository

```typescript
function createTestRepository() {
  return {
    id: 'test-repo-id',
    userId: 'test-user-id',
    githubId: 123456,
    name: 'test-repo',
    fullName: 'owner/test-repo',
    url: 'https://github.com/owner/test-repo',
  };
}
```

### Create Test Pain Point

```typescript
function createTestPainPoint() {
  return {
    id: 'test-pain-point-id',
    title: 'Test Pain Point',
    description: 'Test description',
    category: 'Performance',
    severity: 'high',
    status: 'pending',
    evidence: ['Test evidence'],
  };
}
```

## Testing Best Practices

### 1. Arrange-Act-Assert Pattern

```typescript
it('should create GitHub issue', async () => {
  // Arrange
  const painPoint = createTestPainPoint();
  const mockCreate = jest.fn().mockResolvedValue({ data: { number: 1 } });

  // Act
  const result = await createIssue(painPoint);

  // Assert
  expect(mockCreate).toHaveBeenCalled();
  expect(result.number).toBe(1);
});
```

### 2. Test Edge Cases

```typescript
it('should handle empty activity', async () => {
  const emptyActivity = {
    commits: [],
    pull_requests: [],
    issues: [],
    releases: [],
  };

  const result = await scanner.isSignificantActivity(emptyActivity);
  expect(result).toBe(false);
});
```

### 3. Test Error Handling

```typescript
it('should handle API errors gracefully', async () => {
  mockApi.getData.mockRejectedValue(new Error('API Error'));

  await expect(service.fetchData()).rejects.toThrow('API Error');
});
```

### 4. Use Descriptive Test Names

```typescript
// ✅ Good
it('should return 429 when rate limit exceeded', () => {});

// ❌ Bad
it('test rate limit', () => {});
```

### 5. Keep Tests Independent

```typescript
// Each test should set up its own data
beforeEach(() => {
  // Reset mocks and state
  jest.clearAllMocks();
});
```

## Debugging Tests

### Run Single Test

```bash
npm test -- -t "should scan repository"
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Verbose Output

```bash
npm test -- --verbose
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v2
```

## Performance Testing

### Load Testing with k6

```javascript
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  let res = http.get('https://api.pubwon.com/api/pain-points');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
}
```

## Common Issues

### Mock Not Working

```typescript
// Ensure mock is before import
jest.mock('./module');
import { functionToTest } from './module';
```

### Async Tests Timing Out

```typescript
// Increase timeout
it('should handle long operation', async () => {
  // test code
}, 10000); // 10 second timeout
```

### Database Tests

```typescript
// Use transactions that rollback
beforeEach(async () => {
  await db.transaction(async (tx) => {
    // test in transaction
  });
});
```

## Test Metrics

Track these metrics:

- **Coverage**: Target 70%+
- **Speed**: < 30s for full suite
- **Flakiness**: 0% flaky tests
- **Maintenance**: Update tests with code changes

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
