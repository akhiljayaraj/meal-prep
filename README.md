# meal-prep

A mobile-first PWA for two people to plan a week of meals together: a shared recipe library, weekly menu, and automatically aggregated shopping list.

> Status: not currently hosted; the original Supabase project is offline. To run it, create your own. The app code has since removed sign-in, while the migration's RLS policies allow only authenticated users, so restore sign-in or write your own policies. Opening tables to anonymous users makes them publicly writable.

## Highlights

- The shopping list is computed from menu ingredients rather than stored, so it can't go stale.
- Server components fetch data; small client components handle interaction.
- Weeks start on Monday in UTC. Date and aggregation logic is unit tested.

Stack: Next.js (App Router), React, TypeScript, Tailwind CSS, Supabase, Jest.

## Run

```bash
npm install
# .env.local: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
# then apply supabase/migrations/001_initial.sql
npm run dev
npm test
```

Design notes: [docs/plans](docs/plans).
