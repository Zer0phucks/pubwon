# PubWon - Customer Discovery & Development

Integrate customer discovery into your development cycle with automated Reddit analysis, GitHub integration, and content generation.

## Features

- **GitHub OAuth Authentication** - Secure authentication with GitHub
- **Protected Routes** - Middleware-based route protection
- **User Profile Management** - Update profile information and manage account
- **Session Management** - Persistent authentication across page refreshes
- **Account Deletion** - Complete account removal flow

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Authentication**: Supabase Auth with GitHub OAuth
- **Styling**: Tailwind CSS
- **Testing**: Jest

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- GitHub OAuth App

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pubwon
```

2. Run the initialization script:
```bash
./init.sh
```

3. Configure environment variables in `.env`

4. Set up GitHub OAuth and Supabase (see detailed instructions below)

5. Start the development server:
```bash
npm run dev
```

6. Open http://localhost:3000

## Authentication Implementation

### Phase 2.1: Authentication Flow ✅
- ✅ Supabase Auth UI components
- ✅ Login page with GitHub OAuth
- ✅ Session management with cookies
- ✅ Protected route middleware
- ✅ Logout functionality
- ✅ Authentication error handling

### Phase 2.2: User Profile & Settings ✅
- ✅ User profile page
- ✅ Profile update functionality
- ✅ Account deletion flow
- ✅ User navigation component
- ✅ Protected route wrapper

## Project Structure

```
pubwon/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── auth/              # Authentication
│   │   ├── profile/           # Profile management
│   │   ├── dashboard/         # Dashboard
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── auth/              # Auth components
│   │   └── profile/           # Profile components
│   ├── lib/                   # Utilities
│   │   └── supabase/          # Supabase clients
│   └── types/                 # TypeScript types
├── tests/                     # Test files
├── .env.example              # Environment template
└── init.sh                   # Setup script
```

## Security Best Practices

1. HTTP-only cookies for sessions
2. CSRF protection via Supabase
3. Route protection at middleware level
4. Environment variable security
5. Service role key for admin operations

## Testing

Run tests:
```bash
npm test
```

Test tracking in `tests.json`

## License

MIT
