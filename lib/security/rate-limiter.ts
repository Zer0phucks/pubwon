/**
 * Rate Limiting Implementation
 * Protects API routes from abuse and DDoS attacks
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  identifier: string; // Unique identifier (IP, user ID, etc.)
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();

  constructor() {
    // Cleanup old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  async checkLimit(config: RateLimitConfig): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const now = Date.now();
    const key = config.identifier;
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // New window
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      this.store.set(key, newEntry);

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: newEntry.resetTime,
      };
    }

    // Within existing window
    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    entry.count++;
    this.store.set(key, entry);

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  reset(identifier: string): void {
    this.store.delete(identifier);
  }
}

export const rateLimiter = new RateLimiter();

// Preset configurations
export const RATE_LIMITS = {
  // API endpoints
  API_DEFAULT: { windowMs: 60 * 1000, maxRequests: 60 }, // 60 req/min
  API_STRICT: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 req/min

  // Authentication
  AUTH_LOGIN: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 min
  AUTH_SIGNUP: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 signups per hour

  // Content generation (expensive operations)
  AI_GENERATION: { windowMs: 60 * 60 * 1000, maxRequests: 20 }, // 20 per hour

  // Webhooks
  WEBHOOK: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 per minute

  // Public endpoints
  PUBLIC: { windowMs: 60 * 1000, maxRequests: 120 }, // 120 per minute
};

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  const ip = forwardedFor?.split(',')[0] || realIp || cfConnectingIp || 'unknown';

  return `ip:${ip}`;
}

/**
 * Rate limit middleware for API routes
 */
export async function withRateLimit(
  request: Request,
  config: { windowMs: number; maxRequests: number },
  handler: () => Promise<Response>
): Promise<Response> {
  const identifier = getClientIdentifier(request);

  const result = await rateLimiter.checkLimit({
    ...config,
    identifier,
  });

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        resetTime: new Date(result.resetTime).toISOString(),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.resetTime.toString(),
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  const response = await handler();

  // Add rate limit headers to successful responses
  response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.resetTime.toString());

  return response;
}
