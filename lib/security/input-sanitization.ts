/**
 * Input Sanitization
 * Protects against XSS, SQL injection, and other injection attacks
 */

/**
 * Sanitize HTML input to prevent XSS
 */
export function sanitizeHTML(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize user input for safe storage
 */
export function sanitizeUserInput(input: string): string {
  // Remove control characters except newlines and tabs
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate URL format
 */
export function isValidURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitize filename to prevent directory traversal
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '_')
    .substring(0, 255);
}

/**
 * Validate and sanitize GitHub repository name
 */
export function sanitizeRepoName(repo: string): string {
  // GitHub repo format: owner/repo
  const parts = repo.split('/');
  if (parts.length !== 2) {
    throw new Error('Invalid repository format. Expected: owner/repo');
  }

  const [owner, name] = parts;

  // Validate owner and repo name
  const isValidPart = (part: string) => /^[a-zA-Z0-9._-]+$/.test(part) && part.length <= 100;

  if (!isValidPart(owner) || !isValidPart(name)) {
    throw new Error('Invalid repository name');
  }

  return `${owner}/${name}`;
}

/**
 * Sanitize subreddit name
 */
export function sanitizeSubreddit(subreddit: string): string {
  // Remove r/ prefix if present
  const name = subreddit.startsWith('r/') ? subreddit.slice(2) : subreddit;

  // Validate subreddit name
  if (!/^[a-zA-Z0-9_]{3,21}$/.test(name)) {
    throw new Error('Invalid subreddit name');
  }

  return name;
}

/**
 * Validate webhook signature
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = 'sha256=' + hmac.digest('hex');

  // Constant-time comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Sanitize object by removing sensitive fields
 */
export function removeSensitiveFields<T extends Record<string, any>>(
  obj: T,
  sensitiveFields: string[] = ['password', 'token', 'secret', 'apiKey', 'accessToken']
): Partial<T> {
  const sanitized = { ...obj };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      delete sanitized[field];
    }
  }

  return sanitized;
}

/**
 * Validate JSON input
 */
export function safeJSONParse<T = any>(input: string): T | null {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

/**
 * Rate limit key sanitization
 */
export function sanitizeRateLimitKey(key: string): string {
  // Ensure key is safe for use in storage
  return key.replace(/[^a-zA-Z0-9:_-]/g, '_').substring(0, 100);
}

/**
 * Sanitize and validate UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Content Security Policy headers
 */
export const CSP_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.stripe.com https://api.github.com https://oauth.reddit.com https://api.openai.com",
    "frame-src 'self' https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; '),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
