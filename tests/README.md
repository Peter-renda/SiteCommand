# Tests

Unit tests for the pure, dependency-free logic in `lib/`, run with
[Vitest](https://vitest.dev).

```bash
npm run test        # run once (used by CI)
npm run test:watch  # watch mode
```

## Scope

These tests deliberately cover **pure functions** — permission resolution,
permission-template mapping, the rate limiter, token hashing, the training
schedule, and the curriculum totals that back the marketing site. They run in a
plain Node environment and need **no** database, network, or environment
variables, so they're fast and deterministic in CI (`.github/workflows/ci.yml`).

The `curriculum.test.ts` suite doubles as a guard on the numbers advertised on
the homepage (`app/page.tsx`): if the lesson/track counts change, it fails so the
marketing copy gets updated alongside the content.

## Expanding coverage

Natural next steps, in rough priority order:

1. **Finance calculations** — SOV totals, revised contract amounts, retainage,
   and pay-app math. High value; extract the math into pure helpers first where
   it currently lives inside components/routes.
2. **Component tests** — add `jsdom` + `@testing-library/react` and cover a few
   critical client components (permission-gated buttons, form validation).
3. **API route tests** — with a Supabase test double, cover the auth routes
   (login throttling, password reset single-use tokens, email verification).
4. **E2E smoke** — Playwright is already available in the environment; a small
   marketing-path smoke suite (`/`, `/pricing`, `/login`) needs no DB.

CI currently runs only the unit suite. `next build`, `next lint`, and
`tsc --noEmit` are intentionally left out for now because the repo has
pre-existing lint/type findings and the build needs Supabase/Stripe secrets;
clean those up (or provide CI secrets) before adding them as required checks.
