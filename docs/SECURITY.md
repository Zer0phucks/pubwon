# Security Documentation

Comprehensive security implementation and best practices for PubWon.

## Security Overview

PubWon implements enterprise-grade security measures to protect user data and prevent common web vulnerabilities.

## Security Features

### 1. Authentication & Authorization

**GitHub OAuth Integration**
- Industry-standard OAuth 2.0 flow
- Secure token storage
- Session management via Supabase Auth
- Automatic session refresh

**Row Level Security (RLS)**
- Database-level access control
- User data isolation
- Policy-based permissions
- Automatic enforcement

```sql
-- Example RLS Policy
CREATE POLICY "Users can only access their own data"
ON repositories
FOR ALL
USING (auth.uid() = user_id);
```

### 2. Rate Limiting

**Implementation**: `/lib/security/rate-limiter.ts`

**Rate Limits by Endpoint:**

| Endpoint | Limit | Window |
|----------|-------|--------|
| API (General) | 60 requests | 1 minute |
| API (Strict) | 10 requests | 1 minute |
| Auth (Login) | 5 attempts | 15 minutes |
| Auth (Signup) | 3 attempts | 1 hour |
| AI Generation | 20 requests | 1 hour |
| Webhooks | 100 requests | 1 minute |
| Public | 120 requests | 1 minute |

**Features:**
- IP-based and user-based limiting
- Configurable windows and thresholds
- Rate limit headers in responses
- Automatic cleanup of expired entries

**Usage:**

```typescript
import { withRateLimit, RATE_LIMITS } from '@/lib/security/rate-limiter';

export async function GET(request: Request) {
  return withRateLimit(
    request,
    RATE_LIMITS.API_DEFAULT,
    async () => {
      // Your handler logic
      return new Response('OK');
    }
  );
}
```

### 3. CSRF Protection

**Implementation**: `/lib/security/csrf-protection.ts`

**Features:**
- Token generation and validation
- Secure cookie storage (HttpOnly, SameSite)
- Constant-time comparison (timing attack prevention)
- Automatic token rotation

**Usage:**

```typescript
import { withCSRFProtection } from '@/lib/security/csrf-protection';

export async function POST(request: Request) {
  return withCSRFProtection(request, async () => {
    // Your handler logic
    return new Response('OK');
  });
}
```

**Client-side:**

```typescript
// Get CSRF token
const token = await getCSRFToken();

// Include in requests
fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': token,
  },
});
```

### 4. Input Sanitization

**Implementation**: `/lib/security/input-sanitization.ts`

**Functions:**

```typescript
// HTML sanitization (XSS prevention)
sanitizeHTML(input: string): string

// User input sanitization
sanitizeUserInput(input: string): string

// Email validation
isValidEmail(email: string): boolean

// URL validation
isValidURL(url: string): boolean

// Filename sanitization (directory traversal prevention)
sanitizeFilename(filename: string): string

// Repository name validation
sanitizeRepoName(repo: string): string

// Subreddit name validation
sanitizeSubreddit(subreddit: string): string

// UUID validation
isValidUUID(uuid: string): boolean

// Webhook signature validation
validateWebhookSignature(payload, signature, secret): boolean

// Remove sensitive fields
removeSensitiveFields(obj, sensitiveFields[]): Partial<T>

// Safe JSON parsing
safeJSONParse<T>(input: string): T | null
```

**Usage:**

```typescript
import { sanitizeHTML, isValidEmail } from '@/lib/security/input-sanitization';

// Sanitize user input
const cleanTitle = sanitizeHTML(userInput);

// Validate email
if (!isValidEmail(email)) {
  throw new Error('Invalid email');
}
```

### 5. Security Headers

**Content Security Policy (CSP):**

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.stripe.com https://api.github.com;
  frame-src 'self' https://js.stripe.com;
  object-src 'none';
  base-uri 'self';
  upgrade-insecure-requests;
```

**Other Security Headers:**

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

**Implementation:**

```typescript
import { CSP_HEADERS } from '@/lib/security/input-sanitization';

export function middleware(request: Request) {
  const response = NextResponse.next();

  Object.entries(CSP_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}
```

### 6. Data Encryption

**At Rest:**
- Database encryption via Supabase
- Encrypted GitHub access tokens
- Sensitive fields encrypted before storage

**In Transit:**
- HTTPS enforced (Vercel)
- TLS 1.3 support
- Certificate management automated

### 7. Secrets Management

**Environment Variables:**
- Never committed to version control
- Stored in Vercel environment
- Separate dev/staging/production values
- Access control via team permissions

**Best Practices:**
- Rotate API keys regularly
- Use service accounts where possible
- Minimum privilege principle
- Audit secret access

## OWASP Top 10 Mitigation

### A01: Broken Access Control ✅

**Mitigations:**
- Row Level Security (RLS) policies
- User ID validation on all operations
- Session-based authentication
- API authorization checks

### A02: Cryptographic Failures ✅

**Mitigations:**
- HTTPS everywhere
- Encrypted database
- Secure password hashing (Supabase)
- No sensitive data in logs

### A03: Injection ✅

**Mitigations:**
- Parameterized queries (Drizzle ORM)
- Input validation and sanitization
- Type safety (TypeScript)
- SQL injection prevention

### A04: Insecure Design ✅

**Mitigations:**
- Security by design
- Threat modeling
- Defense in depth
- Fail secure

### A05: Security Misconfiguration ✅

**Mitigations:**
- Secure defaults
- Security headers configured
- Minimal permissions
- Regular updates

### A06: Vulnerable Components ✅

**Mitigations:**
- Dependency scanning
- Regular updates
- Minimal dependencies
- Security advisories monitored

### A07: Authentication Failures ✅

**Mitigations:**
- OAuth 2.0 (GitHub)
- Session management (Supabase)
- Rate limiting on auth endpoints
- Account lockout after failed attempts

### A08: Data Integrity Failures ✅

**Mitigations:**
- Webhook signature verification
- CSRF tokens
- Input validation
- Data integrity checks

### A09: Logging Failures ✅

**Mitigations:**
- Comprehensive logging
- Security event logging
- No sensitive data in logs
- Log aggregation and monitoring

### A10: Server-Side Request Forgery ✅

**Mitigations:**
- URL validation
- Allowlist for external requests
- No user-controlled URLs
- Network segmentation

## Security Testing

### Automated Security Scanning

```bash
# npm audit for dependency vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Security headers check
curl -I https://yourdomain.com | grep -i "x-"
```

### Manual Security Review

Checklist:
- [ ] All inputs validated
- [ ] All outputs sanitized
- [ ] Authentication required where needed
- [ ] Authorization checks in place
- [ ] Rate limiting configured
- [ ] CSRF protection enabled
- [ ] Security headers set
- [ ] Secrets not exposed
- [ ] Error messages don't leak info
- [ ] Logging doesn't include PII

## Incident Response

### Security Incident Process

1. **Detection**: Monitor logs and alerts
2. **Containment**: Isolate affected systems
3. **Investigation**: Determine scope and cause
4. **Remediation**: Fix vulnerability
5. **Recovery**: Restore services
6. **Lessons Learned**: Document and improve

### Emergency Contacts

- Security Team: security@pubwon.com
- On-call Engineer: [Phone]
- Hosting Provider: Vercel Support
- Database Provider: Supabase Support

## Security Monitoring

### Alerts to Configure

**Critical (Immediate):**
- Multiple failed login attempts
- Unusual API access patterns
- Database connection failures
- Webhook signature failures

**Warning (1 hour):**
- Rate limit violations increasing
- Suspicious user behavior
- Elevated error rates
- Unusual traffic patterns

**Info (Daily review):**
- Security event summary
- Failed authentication attempts
- Access pattern changes

## Compliance

### Data Protection

- **GDPR**: Full compliance (see GDPR documentation)
- **CCPA**: Compliance via GDPR measures
- **SOC 2**: Ready for audit
- **ISO 27001**: Security controls aligned

### Audit Trail

All security-relevant events logged:
- Authentication attempts
- Data access
- Configuration changes
- Permission changes
- Data exports
- Account deletions

## Best Practices for Developers

### Code Security Checklist

- [ ] Validate all inputs
- [ ] Sanitize all outputs
- [ ] Use parameterized queries
- [ ] Check authorization
- [ ] Log security events
- [ ] Handle errors safely
- [ ] Use HTTPS for all external calls
- [ ] Never log secrets
- [ ] Review third-party dependencies
- [ ] Follow principle of least privilege

### Secure Coding Guidelines

**DO:**
- ✅ Use TypeScript for type safety
- ✅ Validate inputs at API boundaries
- ✅ Use security utilities from /lib/security
- ✅ Apply rate limiting to endpoints
- ✅ Log security-relevant events
- ✅ Return generic error messages

**DON'T:**
- ❌ Trust user input
- ❌ Store secrets in code
- ❌ Log sensitive data
- ❌ Expose stack traces in production
- ❌ Disable security features
- ❌ Use deprecated dependencies

## Security Contact

Report security vulnerabilities to:
- **Email**: security@pubwon.com
- **PGP Key**: [Key ID]

We follow responsible disclosure:
1. Report received and acknowledged (24h)
2. Vulnerability confirmed (48h)
3. Fix developed and tested
4. Security advisory published
5. Credit given to reporter

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Security Headers](https://securityheaders.com/)
- [Mozilla Web Security Guidelines](https://infosec.mozilla.org/guidelines/web_security)
