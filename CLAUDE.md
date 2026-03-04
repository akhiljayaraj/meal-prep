# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Turbopack)
npm run build      # Production build
npm run lint       # ESLint
npm test           # Run all tests (Jest)
npm run test:watch # Watch mode
```

To run a single test file:
```bash
npx jest src/lib/utils/__tests__/dates.test.ts
```

## Architecture

**Collaborative meal-prep PWA** for two users. Mobile-first, installable on iPhone.

- **Next.js 16 App Router** on Vercel free tier — no custom backend
- **Supabase** handles Google OAuth, Postgres DB, and recipe photo storage
- **All DB calls** go directly from the browser (browser client) or server components/API routes (server client) — no intermediate API layer

### Auth flow
- Middleware (`src/middleware.ts`) protects all routes except `/login` and `/auth/*`
- Google OAuth → Supabase → callback at `/auth/callback/route.ts` → redirect to `/`
- Two clients: `src/lib/supabase/client.ts` (browser, `createBrowserClient`) and `src/lib/supabase/server.ts` (server components/route handlers, `createServerClient` + cookies)

### Pages

| Route | Purpose |
|-------|---------|
| `/` | Current week's menu (auto-creates `weekly_menus` row for current week) |
| `/recipes` | Recipe library |
| `/recipes/new` | Add recipe with `IngredientBuilder` component |
| `/recipes/[id]` | Recipe detail |
| `/recipes/picker` | Recipe picker modal (used from menu page) |
| `/shopping-list` | Aggregated ingredients from current week's menu |
| `/history` | Past weekly menus with "Add to this week" |
| `/login` | Google OAuth sign-in |

### Data model (Supabase Postgres)

- **`recipes`** — `id, title, description, image_url, ingredients (jsonb), created_by, created_at`
- **`weekly_menus`** — `id, week_start_date (date, always Monday), created_at`
- **`menu_recipes`** — join table linking menus to recipes; unique `(menu_id, recipe_id)`
- Shopping list is **computed on the fly** — no stored table. See `src/lib/utils/shopping.ts`
- Weeks always start on **Monday** (UTC). See `src/lib/utils/dates.ts`

TypeScript types mirror this schema in `src/types/index.ts`.

### Key patterns

- Server components fetch data, pass to `*Client.tsx` client components for interactivity
- `ingredients` stored as JSONB: `{ name: string, quantity: string, unit: string }[]`
- Shopping list checked state lives in **localStorage** (resets each new week)
- PWA: `public/manifest.json` + service worker registered by `ServiceWorkerRegistrar` component

### Environment variables required

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Database migrations

Schema lives in `supabase/migrations/001_initial.sql`. Apply manually via Supabase dashboard SQL editor. RLS is enabled — any authenticated user can read/write all data (shared between both users by design).

A `recipe-images` storage bucket must be created manually in the Supabase dashboard as a **public** bucket.

### Note on next-pwa

`next-pwa` is in `package.json` but is **not used** — it's incompatible with Turbopack. The service worker is registered manually via `ServiceWorkerRegistrar`.
