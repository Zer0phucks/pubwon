// E2E test setup for Playwright tests
// This file will be used when Playwright tests are implemented

export const TEST_CONFIG = {
  baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
};

export const mockGitHubOAuth = () => {
  // Mock GitHub OAuth for testing
};

export const mockStripeCheckout = () => {
  // Mock Stripe checkout for testing
};
