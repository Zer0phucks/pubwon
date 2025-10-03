# Repository Guidelines

## Project Structure & Module Organization
PubWon runs on Next.js 14 with the App Router. Live routes and UI shells reside in `app/` (auth flow, dashboard, onboarding) with API handlers under `app/api/**`. Shared service logic lives in `lib/` for Stripe, GitHub, Reddit, AI, and email integrations. UI components belong in `components/` (and `src/components/` during migrations), while domain types live in `types/`. Database changes sit in `supabase/migrations/`; helper scripts stay in `scripts/`. Tests live under `tests/`, `__tests__/`, and `src/__tests__/`—mirror the layer you cover.

## Build, Test, and Development Commands
- `npm run dev`: start the Next.js dev server with hot reload.
- `npm run build`: produce a production build; run before shipping major changes.
- `npm run start`: serve the production bundle locally.
- `npm run lint`: run ESLint with Next.js defaults; required before PR approval.
- `npm run test`, `npm run test:watch`: execute Jest suites once or in watch mode.
- `npm run db:generate` / `npm run db:migrate`: manage Drizzle migrations targeting `supabase`.

## Coding Style & Naming Conventions
TypeScript is standard with 2-space indentation, semicolons, single quotes, and 100-character lines enforced by Prettier (`.prettierrc`). Run Prettier on staged files or integrate the Next lint check. Prefer PascalCase for React components (`components/DashboardCard.tsx`), camelCase for functions and variables, and SCREAMING_SNAKE_CASE for env keys defined in `.env.example`. Avoid `any`; ESLint downgrades it to a warning.

## Testing Guidelines
Jest + Testing Library power unit and integration tests. Name files `*.test.ts` or `*.test.tsx` and co-locate under the relevant folder (e.g., `__tests__/services/usage-tracker.test.ts`). Use mocks for external providers (Stripe, GitHub, Reddit) to keep tests deterministic. Focus coverage on quotas, webhook handling, and async workflows. Run `npm run test` prior to pushes; add focused `describe` blocks when reproducing bugs.

## Commit & Pull Request Guidelines
Follow Conventional Commits (`feat:`, `fix:`, `chore:`) as seen in recent history, keeping subjects under 72 characters. Each commit should encapsulate one logical change with updated docs or tests. Pull requests must include a concise summary, linked issue (if any), screenshots for UI-facing work, and clear test evidence (`npm run test`, `npm run lint`). Request review once CI passes and migrations or secrets updates are documented.

## Environment & Secrets
Copy `.env.example` to `.env`, fill in provider keys, keep local Supabase running before Drizzle commands, and never commit secrets—update `claudedocs/` if requirements change.
