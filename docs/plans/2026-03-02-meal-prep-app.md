# Meal Prep App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a collaborative meal prep PWA for two users to manage a shared recipe library, plan weekly menus, and generate an aggregated shopping list — hosted free on Vercel with Supabase.

**Architecture:** Next.js 14 App Router on Vercel (free tier). Supabase handles Google OAuth, Postgres database, and photo storage. No custom backend — Supabase JS client runs in the browser. PWA manifest enables iPhone home screen installation.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, @supabase/supabase-js, @supabase/ssr, next-pwa, Jest, React Testing Library

---

## Overview of Tasks

1. Initialize Next.js project
2. Supabase project setup (manual steps)
3. Supabase client + TypeScript types
4. Date utilities (TDD)
5. Shopping list aggregation (TDD)
6. Authentication + middleware
7. App layout + bottom navigation
8. Recipe library page
9. Add recipe page
10. Recipe detail page
11. Weekly menu page (home)
12. Shopping list page
13. History page
14. PWA configuration
15. Deploy to Vercel

---

### Task 1: Initialize Next.js Project

**Files:**
- Create: project root (via create-next-app)
- Create: `jest.config.ts`
- Create: `jest.setup.ts`

**Step 1: Scaffold the project**

Run from `/Users/akhil/workspace/`:
```bash
npx create-next-app@latest meal-prep \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-git
```

When prompted, accept all defaults.

**Step 2: Install dependencies**

```bash
cd meal-prep
npm install @supabase/supabase-js @supabase/ssr
npm install next-pwa
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom ts-jest @types/jest
```

**Step 3: Create jest.config.ts**

Create `jest.config.ts`:
```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
}

export default createJestConfig(config)
```

**Step 4: Create jest.setup.ts**

Create `jest.setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

**Step 5: Add test script to package.json**

In `package.json`, find the `"scripts"` section and add:
```json
"test": "jest",
"test:watch": "jest --watch"
```

**Step 6: Create .env.local**

Create `.env.local` in project root:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```
(Real values come from Task 2.)

**Step 7: Verify .gitignore includes .env.local**

Check `.gitignore` — it should already contain `.env.local` from create-next-app.

**Step 8: Initialize git and commit**

```bash
git init
git add .
git commit -m "feat: initialize Next.js project with Tailwind, Supabase, and Jest"
```
Expected: commit created successfully.

---

### Task 2: Supabase Project Setup (Manual)

> This task is manual setup steps, no code to write. Complete all steps before moving on.

**Step 1: Create a Supabase project**

1. Go to https://supabase.com — sign in (free account)
2. Click "New project"
3. Name: `meal-prep`, pick closest region, set a database password
4. Wait ~2 minutes for provisioning

**Step 2: Copy API keys into .env.local**

In Supabase dashboard → Settings → API:
- Copy **Project URL** → replace `your_supabase_url_here` in `.env.local`
- Copy **anon public** key → replace `your_supabase_anon_key_here` in `.env.local`

**Step 3: Enable Google OAuth**

1. In Supabase dashboard → Authentication → Providers → Google → Enable
2. Go to https://console.cloud.google.com
3. Create a new project (or use existing)
4. APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
5. Application type: **Web application**
6. Authorized redirect URIs: `https://<your-supabase-ref>.supabase.co/auth/v1/callback`
   (find your supabase-ref in your project URL, e.g. `abcdefgh.supabase.co`)
7. Copy **Client ID** and **Client Secret** into Supabase Google provider settings → Save

**Step 4: Create database tables**

In Supabase dashboard → SQL Editor → New query, paste and run:
```sql
-- recipes table
create table public.recipes (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  image_url text,
  ingredients jsonb not null default '[]',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- weekly_menus table
create table public.weekly_menus (
  id uuid default gen_random_uuid() primary key,
  week_start_date date not null unique,
  created_at timestamptz default now()
);

-- menu_recipes join table
create table public.menu_recipes (
  id uuid default gen_random_uuid() primary key,
  menu_id uuid references public.weekly_menus(id) on delete cascade,
  recipe_id uuid references public.recipes(id) on delete cascade,
  added_by uuid references auth.users(id) on delete set null,
  added_at timestamptz default now(),
  unique(menu_id, recipe_id)
);

-- Enable RLS on all tables
alter table public.recipes enable row level security;
alter table public.weekly_menus enable row level security;
alter table public.menu_recipes enable row level security;

-- RLS policies: any authenticated user can read/write everything
create policy "auth_select_recipes" on public.recipes for select to authenticated using (true);
create policy "auth_insert_recipes" on public.recipes for insert to authenticated with check (true);
create policy "auth_update_recipes" on public.recipes for update to authenticated using (true);
create policy "auth_delete_recipes" on public.recipes for delete to authenticated using (true);

create policy "auth_select_menus" on public.weekly_menus for select to authenticated using (true);
create policy "auth_insert_menus" on public.weekly_menus for insert to authenticated with check (true);

create policy "auth_select_menu_recipes" on public.menu_recipes for select to authenticated using (true);
create policy "auth_insert_menu_recipes" on public.menu_recipes for insert to authenticated with check (true);
create policy "auth_delete_menu_recipes" on public.menu_recipes for delete to authenticated using (true);
```

**Step 5: Create photo storage bucket**

In Supabase dashboard → Storage → New bucket:
- Name: `recipe-images`
- Public bucket: ✓ Yes

Then in SQL Editor, run:
```sql
create policy "auth_upload_images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'recipe-images');

create policy "public_read_images"
  on storage.objects for select to public
  using (bucket_id = 'recipe-images');
```

**Step 6: Save migration locally**

Create `supabase/migrations/001_initial.sql` and paste the SQL from Steps 4 and 5 into it (for your records).

**Step 7: Commit**

```bash
git add supabase/
git commit -m "feat: add Supabase migration file"
```

---

### Task 3: Supabase Client + TypeScript Types

**Files:**
- Create: `src/types/index.ts`
- Create: `src/types/__tests__/index.test.ts`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`

**Step 1: Write failing type smoke test**

Create `src/types/__tests__/index.test.ts`:
```typescript
import type { Recipe, Ingredient } from '../index'

test('Recipe type shape is correct', () => {
  const recipe: Recipe = {
    id: '123',
    title: 'Pasta',
    description: 'Simple pasta',
    image_url: null,
    ingredients: [{ name: 'Pasta', quantity: '200', unit: 'g' }],
    created_by: 'user-1',
    created_at: '2026-03-02T00:00:00Z',
  }
  expect(recipe.title).toBe('Pasta')
  expect(recipe.ingredients[0].name).toBe('Pasta')
})
```

Run: `npm test -- --testPathPattern=types`
Expected: FAIL with "Cannot find module '../index'"

**Step 2: Create types**

Create `src/types/index.ts`:
```typescript
export interface Ingredient {
  name: string
  quantity: string
  unit: string
}

export interface Recipe {
  id: string
  title: string
  description: string | null
  image_url: string | null
  ingredients: Ingredient[]
  created_by: string | null
  created_at: string
}

export interface WeeklyMenu {
  id: string
  week_start_date: string
  created_at: string
}

export interface MenuRecipe {
  id: string
  menu_id: string
  recipe_id: string
  added_by: string | null
  added_at: string
}

export interface MenuRecipeWithRecipe extends MenuRecipe {
  recipe: Recipe
}
```

**Step 3: Run test to verify it passes**

Run: `npm test -- --testPathPattern=types`
Expected: PASS (1 test)

**Step 4: Create Supabase browser client**

Create `src/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Step 5: Create Supabase server client**

Create `src/lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component — cookie setting ignored safely
          }
        },
      },
    }
  )
}
```

**Step 6: Commit**

```bash
git add src/
git commit -m "feat: add TypeScript types and Supabase clients"
```

---

### Task 4: Date Utilities (TDD)

**Files:**
- Create: `src/lib/utils/__tests__/dates.test.ts`
- Create: `src/lib/utils/dates.ts`

**Step 1: Write failing tests**

Create `src/lib/utils/__tests__/dates.test.ts`:
```typescript
import { getWeekStart, getWeekStartString, formatWeekLabel } from '../dates'

describe('getWeekStart', () => {
  test('returns Monday for a Wednesday', () => {
    // 2026-03-04 is a Wednesday
    const result = getWeekStart(new Date('2026-03-04T12:00:00Z'))
    expect(result.toISOString().slice(0, 10)).toBe('2026-03-02')
  })

  test('returns same Monday for a Monday', () => {
    const result = getWeekStart(new Date('2026-03-02T12:00:00Z'))
    expect(result.toISOString().slice(0, 10)).toBe('2026-03-02')
  })

  test('returns previous Monday for a Sunday', () => {
    // 2026-03-08 is a Sunday
    const result = getWeekStart(new Date('2026-03-08T12:00:00Z'))
    expect(result.toISOString().slice(0, 10)).toBe('2026-03-02')
  })
})

describe('formatWeekLabel', () => {
  test('formats a date string as "Week of Mar 2"', () => {
    expect(formatWeekLabel('2026-03-02')).toBe('Week of Mar 2')
  })
})
```

Run: `npm test -- --testPathPattern=dates`
Expected: FAIL with "Cannot find module '../dates'"

**Step 2: Implement dates utility**

Create `src/lib/utils/dates.ts`:
```typescript
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date)
  const day = d.getUTCDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day // shift to Monday
  d.setUTCDate(d.getUTCDate() + diff)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

export function getWeekStartString(date: Date = new Date()): string {
  return getWeekStart(date).toISOString().slice(0, 10)
}

export function formatWeekLabel(weekStartDate: string): string {
  const date = new Date(weekStartDate + 'T00:00:00Z')
  return `Week of ${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })}`
}
```

**Step 3: Run tests to verify they pass**

Run: `npm test -- --testPathPattern=dates`
Expected: PASS (4 tests)

**Step 4: Commit**

```bash
git add src/lib/utils/
git commit -m "feat: add date utilities with tests"
```

---

### Task 5: Shopping List Aggregation (TDD)

**Files:**
- Create: `src/lib/utils/__tests__/shopping.test.ts`
- Create: `src/lib/utils/shopping.ts`

**Step 1: Write failing tests**

Create `src/lib/utils/__tests__/shopping.test.ts`:
```typescript
import { aggregateIngredients } from '../shopping'
import type { Recipe } from '@/types'

const makeRecipe = (ingredients: Recipe['ingredients']): Recipe => ({
  id: '1',
  title: 'Test',
  description: null,
  image_url: null,
  ingredients,
  created_by: null,
  created_at: '2026-03-02T00:00:00Z',
})

describe('aggregateIngredients', () => {
  test('returns empty array for no recipes', () => {
    expect(aggregateIngredients([])).toEqual([])
  })

  test('returns ingredients from a single recipe', () => {
    const recipes = [makeRecipe([{ name: 'Onion', quantity: '2', unit: 'pcs' }])]
    expect(aggregateIngredients(recipes)).toEqual([{ name: 'Onion', quantity: '2', unit: 'pcs' }])
  })

  test('sums numeric quantities for same-name ingredients', () => {
    const recipes = [
      makeRecipe([{ name: 'Garlic', quantity: '3', unit: 'cloves' }]),
      makeRecipe([{ name: 'Garlic', quantity: '2', unit: 'cloves' }]),
    ]
    expect(aggregateIngredients(recipes)).toEqual([
      { name: 'Garlic', quantity: '5', unit: 'cloves' },
    ])
  })

  test('keeps different ingredients separate', () => {
    const recipes = [
      makeRecipe([
        { name: 'Onion', quantity: '1', unit: 'pcs' },
        { name: 'Garlic', quantity: '2', unit: 'cloves' },
      ]),
    ]
    expect(aggregateIngredients(recipes)).toHaveLength(2)
  })

  test('case-insensitive matching for ingredient names', () => {
    const recipes = [
      makeRecipe([{ name: 'onion', quantity: '1', unit: 'pcs' }]),
      makeRecipe([{ name: 'Onion', quantity: '2', unit: 'pcs' }]),
    ]
    expect(aggregateIngredients(recipes)).toHaveLength(1)
    expect(aggregateIngredients(recipes)[0].quantity).toBe('3')
  })

  test('keeps non-numeric quantities, ignores duplicate', () => {
    const recipes = [
      makeRecipe([{ name: 'Salt', quantity: 'to taste', unit: '' }]),
      makeRecipe([{ name: 'Salt', quantity: 'pinch', unit: '' }]),
    ]
    const result = aggregateIngredients(recipes)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Salt')
  })
})
```

Run: `npm test -- --testPathPattern=shopping`
Expected: FAIL with "Cannot find module '../shopping'"

**Step 2: Implement shopping aggregation**

Create `src/lib/utils/shopping.ts`:
```typescript
import type { Recipe, Ingredient } from '@/types'

export function aggregateIngredients(recipes: Recipe[]): Ingredient[] {
  const map = new Map<string, Ingredient>()

  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients) {
      const key = ingredient.name.toLowerCase().trim()
      if (!map.has(key)) {
        map.set(key, { ...ingredient })
        continue
      }
      const existing = map.get(key)!
      const existingQty = parseFloat(existing.quantity)
      const newQty = parseFloat(ingredient.quantity)
      if (!isNaN(existingQty) && !isNaN(newQty)) {
        map.set(key, { ...existing, quantity: String(existingQty + newQty) })
      }
      // non-numeric quantities: keep first, ignore duplicate
    }
  }

  return Array.from(map.values())
}
```

**Step 3: Run tests to verify they pass**

Run: `npm test -- --testPathPattern=shopping`
Expected: PASS (6 tests)

**Step 4: Run all tests**

Run: `npm test`
Expected: PASS (all tests)

**Step 5: Commit**

```bash
git add src/lib/utils/
git commit -m "feat: add shopping list aggregation with tests"
```

---

### Task 6: Authentication + Middleware

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/auth/callback/route.ts`
- Create: `src/middleware.ts`

**Step 1: Create login page**

Create `src/app/login/page.tsx`:
```tsx
'use client'

import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-sm w-full text-center space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meal Prep</h1>
          <p className="mt-2 text-gray-500">Plan your week together</p>
        </div>
        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 font-medium text-gray-700 transition"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  )
}
```

**Step 2: Create OAuth callback route**

Create `src/app/auth/callback/route.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}/`)
}
```

**Step 3: Create middleware to protect routes**

Create `src/middleware.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isPublicPath =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/auth')

  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)'],
}
```

**Step 4: Verify auth flow**

Run: `npm run dev`
- Visit http://localhost:3000 → should redirect to /login
- Click "Sign in with Google" → Google OAuth
- After completing OAuth → redirects to /

**Step 5: Commit**

```bash
git add src/app/login src/app/auth src/middleware.ts
git commit -m "feat: add Google OAuth authentication and route protection"
```

---

### Task 7: App Layout + Bottom Navigation

**Files:**
- Create: `src/components/BottomNav.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: Create BottomNav component**

Create `src/components/BottomNav.tsx`:
```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  {
    href: '/',
    label: 'Menu',
    icon: (active: boolean) => (
      <svg className={`w-6 h-6 ${active ? 'text-emerald-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: '/recipes',
    label: 'Recipes',
    icon: (active: boolean) => (
      <svg className={`w-6 h-6 ${active ? 'text-emerald-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    href: '/shopping-list',
    label: 'List',
    icon: (active: boolean) => (
      <svg className={`w-6 h-6 ${active ? 'text-emerald-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    href: '/history',
    label: 'History',
    icon: (active: boolean) => (
      <svg className={`w-6 h-6 ${active ? 'text-emerald-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-lg mx-auto flex">
        {tabs.map((tab) => {
          const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center py-2 gap-0.5"
            >
              {tab.icon(active)}
              <span className={`text-xs ${active ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

**Step 2: Replace src/app/layout.tsx**

Read `src/app/layout.tsx` first, then replace its entire contents with:
```tsx
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import BottomNav from '@/components/BottomNav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Meal Prep',
  description: 'Plan your weekly meals together',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Meal Prep',
  },
}

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="max-w-lg mx-auto pb-20 min-h-screen">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  )
}
```

**Step 3: Verify in browser**

Run: `npm run dev`
- Visit http://localhost:3000 (after login)
- Should see 4 tabs in bottom navigation
- Active tab should be highlighted in emerald green

**Step 4: Commit**

```bash
git add src/components/BottomNav.tsx src/app/layout.tsx
git commit -m "feat: add app layout with bottom navigation"
```

---

### Task 8: Recipe Library Page

**Files:**
- Create: `src/components/RecipeCard.tsx`
- Create: `src/app/recipes/page.tsx`

**Step 1: Create RecipeCard component**

Create `src/components/RecipeCard.tsx`:
```tsx
import Link from 'next/link'
import type { Recipe } from '@/types'

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="flex gap-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100 active:bg-gray-50"
    >
      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
        {recipe.image_url ? (
          <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{recipe.title}</h3>
        {recipe.description && (
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{recipe.description}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">{recipe.ingredients.length} ingredients</p>
      </div>
    </Link>
  )
}
```

**Step 2: Create recipes page**

Create `src/app/recipes/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import RecipeCard from '@/components/RecipeCard'
import type { Recipe } from '@/types'

export default async function RecipesPage() {
  const supabase = await createClient()
  const { data: recipes } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Recipes</h1>
        <Link
          href="/recipes/new"
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Add
        </Link>
      </div>
      {!recipes?.length ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No recipes yet</p>
          <p className="text-sm mt-1">Add your first recipe to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recipes.map((recipe: Recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 3: Verify in browser**

- Visit /recipes — empty state with "+ Add" button
- (After adding recipes in Task 9, cards should appear here)

**Step 4: Commit**

```bash
git add src/app/recipes/page.tsx src/components/RecipeCard.tsx
git commit -m "feat: add recipe library page"
```

---

### Task 9: Add Recipe Page

**Files:**
- Create: `src/components/IngredientBuilder.tsx`
- Create: `src/app/recipes/new/page.tsx`

**Step 1: Create IngredientBuilder component**

Create `src/components/IngredientBuilder.tsx`:
```tsx
'use client'

import { useState } from 'react'
import type { Ingredient } from '@/types'

interface Props {
  ingredients: Ingredient[]
  onChange: (ingredients: Ingredient[]) => void
}

export default function IngredientBuilder({ ingredients, onChange }: Props) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')

  function add() {
    if (!name.trim()) return
    onChange([...ingredients, { name: name.trim(), quantity: quantity.trim(), unit: unit.trim() }])
    setName('')
    setQuantity('')
    setUnit('')
  }

  function remove(index: number) {
    onChange(ingredients.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {ingredients.map((ingredient, i) => (
          <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
            <span className="flex-1 text-sm">
              {ingredient.quantity} {ingredient.unit} {ingredient.name}
            </span>
            <button type="button" onClick={() => remove(i)} className="text-gray-400 hover:text-red-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ingredient"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
        />
        <input
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
          placeholder="Qty"
          className="w-16 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <input
          value={unit}
          onChange={e => setUnit(e.target.value)}
          placeholder="Unit"
          className="w-16 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={add}
          className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-medium"
        >
          Add
        </button>
      </div>
    </div>
  )
}
```

**Step 2: Create add recipe page**

Create `src/app/recipes/new/page.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import IngredientBuilder from '@/components/IngredientBuilder'
import type { Ingredient } from '@/types'

export default function NewRecipePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [saving, setSaving] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setImageUrl('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let finalImageUrl = imageUrl
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `${user!.id}/${Date.now()}.${ext}`
      const { data } = await supabase.storage.from('recipe-images').upload(path, imageFile)
      if (data) {
        const { data: { publicUrl } } = supabase.storage.from('recipe-images').getPublicUrl(data.path)
        finalImageUrl = publicUrl
      }
    }

    await supabase.from('recipes').insert({
      title: title.trim(),
      description: description.trim() || null,
      image_url: finalImageUrl || null,
      ingredients,
      created_by: user!.id,
    })

    router.push('/recipes')
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">New Recipe</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="e.g. Chicken Stir Fry"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="A quick and healthy weeknight dinner..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
          {(imagePreview || imageUrl) && (
            <img src={imagePreview || imageUrl} alt="Preview" className="w-full h-48 object-cover rounded-lg mb-3" />
          )}
          <div className="space-y-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700"
            />
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or paste URL</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <input
              value={imageUrl}
              onChange={e => { setImageUrl(e.target.value); setImageFile(null); setImagePreview('') }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="https://example.com/photo.jpg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ingredients</label>
          <IngredientBuilder ingredients={ingredients} onChange={setIngredients} />
        </div>

        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Recipe'}
        </button>
      </form>
    </div>
  )
}
```

**Step 3: Verify in browser**

- Go to /recipes → click "+ Add"
- Fill in title, description, ingredients, optional photo
- Save → redirects to /recipes, new card appears

**Step 4: Commit**

```bash
git add src/app/recipes/new src/components/IngredientBuilder.tsx
git commit -m "feat: add recipe creation form with photo upload"
```

---

### Task 10: Recipe Detail Page

**Files:**
- Create: `src/app/recipes/[id]/page.tsx`

**Step 1: Create recipe detail page**

Create `src/app/recipes/[id]/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Recipe } from '@/types'

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: recipe } = await supabase.from('recipes').select('*').eq('id', id).single()

  if (!recipe) notFound()

  const r = recipe as Recipe

  return (
    <div className="pb-8">
      {r.image_url && (
        <div className="w-full h-56 overflow-hidden">
          <img src={r.image_url} alt={r.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start gap-3 mb-4">
          <Link href="/recipes" className="text-gray-500 mt-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex-1">{r.title}</h1>
        </div>

        {r.description && <p className="text-gray-600 mb-6">{r.description}</p>}

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Ingredients</h2>
          {r.ingredients.length === 0 ? (
            <p className="text-gray-400 text-sm">No ingredients listed</p>
          ) : (
            <ul className="space-y-2">
              {r.ingredients.map((ingredient, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span>
                    {ingredient.quantity} {ingredient.unit}{' '}
                    <span className="font-medium">{ingredient.name}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Verify in browser**

- Go to /recipes → click a recipe card
- Should show full recipe: image, description, ingredients list

**Step 3: Commit**

```bash
git add src/app/recipes/[id]/
git commit -m "feat: add recipe detail page"
```

---

### Task 11: Weekly Menu Page (Home)

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/app/MenuPageClient.tsx`
- Create: `src/app/recipes/picker/page.tsx`
- Create: `src/app/recipes/picker/RecipePickerClient.tsx`

**Step 1: Create recipe picker server page**

Create `src/app/recipes/picker/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import RecipePickerClient from './RecipePickerClient'
import type { Recipe } from '@/types'

export default async function RecipePickerPage({
  searchParams,
}: {
  searchParams: Promise<{ menuId: string }>
}) {
  const { menuId } = await searchParams
  const supabase = await createClient()

  const { data: recipes } = await supabase.from('recipes').select('*').order('title')
  const { data: existing } = await supabase
    .from('menu_recipes')
    .select('recipe_id')
    .eq('menu_id', menuId)

  const existingIds = new Set(existing?.map(r => r.recipe_id) ?? [])

  return (
    <RecipePickerClient
      recipes={(recipes ?? []) as Recipe[]}
      menuId={menuId}
      existingIds={existingIds}
    />
  )
}
```

**Step 2: Create recipe picker client**

Create `src/app/recipes/picker/RecipePickerClient.tsx`:
```tsx
'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Recipe } from '@/types'

interface Props {
  recipes: Recipe[]
  menuId: string
  existingIds: Set<string>
}

export default function RecipePickerClient({ recipes, menuId, existingIds }: Props) {
  const router = useRouter()

  async function addRecipe(recipeId: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('menu_recipes').insert({
      menu_id: menuId,
      recipe_id: recipeId,
      added_by: user!.id,
    })
    router.push('/')
    router.refresh()
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="text-gray-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">Pick a Dish</h1>
      </div>

      {recipes.length === 0 ? (
        <p className="text-gray-400 text-center py-16">No recipes yet. Add some first!</p>
      ) : (
        <div className="space-y-2">
          {recipes.map(recipe => {
            const added = existingIds.has(recipe.id)
            return (
              <button
                key={recipe.id}
                onClick={() => !added && addRecipe(recipe.id)}
                disabled={added}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                  added
                    ? 'bg-emerald-50 border-emerald-200 opacity-60'
                    : 'bg-white border-gray-100 active:bg-gray-50'
                }`}
              >
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {recipe.image_url ? (
                    <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No img</div>
                  )}
                </div>
                <span className="flex-1 font-medium text-gray-900">{recipe.title}</span>
                {added && <span className="text-emerald-600 text-sm">Added</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

**Step 3: Create home page (menu)**

Create `src/app/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import { getWeekStartString, formatWeekLabel } from '@/lib/utils/dates'
import MenuPageClient from './MenuPageClient'
import type { MenuRecipeWithRecipe } from '@/types'

async function getOrCreateCurrentMenu(supabase: Awaited<ReturnType<typeof createClient>>) {
  const weekStart = getWeekStartString()
  let { data: menu } = await supabase
    .from('weekly_menus')
    .select('*')
    .eq('week_start_date', weekStart)
    .single()

  if (!menu) {
    const { data } = await supabase
      .from('weekly_menus')
      .insert({ week_start_date: weekStart })
      .select()
      .single()
    menu = data
  }
  return menu
}

export default async function MenuPage() {
  const supabase = await createClient()
  const menu = await getOrCreateCurrentMenu(supabase)

  const { data: menuRecipes } = await supabase
    .from('menu_recipes')
    .select('*, recipe:recipes(*)')
    .eq('menu_id', menu.id)
    .order('added_at')

  return (
    <MenuPageClient
      menu={menu}
      menuRecipes={(menuRecipes ?? []) as MenuRecipeWithRecipe[]}
      weekLabel={formatWeekLabel(menu.week_start_date)}
    />
  )
}
```

**Step 4: Create menu page client**

Create `src/app/MenuPageClient.tsx`:
```tsx
'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { MenuRecipeWithRecipe, WeeklyMenu } from '@/types'

interface Props {
  menu: WeeklyMenu
  menuRecipes: MenuRecipeWithRecipe[]
  weekLabel: string
}

export default function MenuPageClient({ menu, menuRecipes, weekLabel }: Props) {
  const router = useRouter()

  async function removeRecipe(menuRecipeId: string) {
    const supabase = createClient()
    await supabase.from('menu_recipes').delete().eq('id', menuRecipeId)
    router.refresh()
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">This Week</h1>
          <p className="text-sm text-gray-400">{weekLabel}</p>
        </div>
        <button
          onClick={() => router.push(`/recipes/picker?menuId=${menu.id}`)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Add dish
        </button>
      </div>

      {menuRecipes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No dishes yet</p>
          <p className="text-sm mt-1">Add dishes to plan this week's meals</p>
        </div>
      ) : (
        <div className="space-y-3">
          {menuRecipes.map(mr => (
            <div key={mr.id} className="flex gap-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {mr.recipe.image_url ? (
                  <img src={mr.recipe.image_url} alt={mr.recipe.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No img</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">{mr.recipe.title}</h3>
                {mr.recipe.description && (
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{mr.recipe.description}</p>
                )}
              </div>
              <button
                onClick={() => removeRecipe(mr.id)}
                className="text-gray-300 hover:text-red-400 flex-shrink-0 self-start"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 5: Verify in browser**

- Visit / → shows current week label and empty state
- "+ Add dish" → recipe picker
- Pick a dish → back on / with dish shown
- X on a dish → removes it

**Step 6: Commit**

```bash
git add src/app/page.tsx src/app/MenuPageClient.tsx src/app/recipes/picker/
git commit -m "feat: add weekly menu page with recipe picker"
```

---

### Task 12: Shopping List Page

**Files:**
- Create: `src/app/shopping-list/page.tsx`
- Create: `src/app/shopping-list/ShoppingListClient.tsx`

**Step 1: Create shopping list server page**

Create `src/app/shopping-list/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import { getWeekStartString } from '@/lib/utils/dates'
import { aggregateIngredients } from '@/lib/utils/shopping'
import ShoppingListClient from './ShoppingListClient'
import type { Recipe } from '@/types'

export default async function ShoppingListPage() {
  const supabase = await createClient()
  const weekStart = getWeekStartString()

  const { data: menu } = await supabase
    .from('weekly_menus')
    .select('id')
    .eq('week_start_date', weekStart)
    .single()

  if (!menu) {
    return (
      <div className="p-4 text-center py-16 text-gray-400">
        <p>No menu for this week yet.</p>
      </div>
    )
  }

  const { data: menuRecipes } = await supabase
    .from('menu_recipes')
    .select('recipe:recipes(id, title, description, image_url, ingredients, created_by, created_at)')
    .eq('menu_id', menu.id)

  const recipes = (menuRecipes ?? []).map(mr => mr.recipe) as Recipe[]
  const ingredients = aggregateIngredients(recipes)

  return <ShoppingListClient ingredients={ingredients} weekStart={weekStart} />
}
```

**Step 2: Create shopping list client with checklist state**

Create `src/app/shopping-list/ShoppingListClient.tsx`:
```tsx
'use client'

import { useState, useEffect } from 'react'
import type { Ingredient } from '@/types'

interface Props {
  ingredients: Ingredient[]
  weekStart: string
}

export default function ShoppingListClient({ ingredients, weekStart }: Props) {
  const storageKey = `checked-${weekStart}`
  const [checked, setChecked] = useState<Set<string>>(new Set())

  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored) setChecked(new Set(JSON.parse(stored)))
  }, [storageKey])

  function toggle(key: string) {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      localStorage.setItem(storageKey, JSON.stringify([...next]))
      return next
    })
  }

  if (ingredients.length === 0) {
    return (
      <div className="p-4 text-center py-16 text-gray-400">
        <p className="text-lg">No ingredients yet</p>
        <p className="text-sm mt-1">Add dishes to this week's menu first</p>
      </div>
    )
  }

  const remaining = ingredients.filter(i => !checked.has(i.name.toLowerCase()))
  const done = ingredients.filter(i => checked.has(i.name.toLowerCase()))

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Shopping List</h1>
      <div className="space-y-2">
        {remaining.map(ingredient => (
          <button
            key={ingredient.name}
            onClick={() => toggle(ingredient.name.toLowerCase())}
            className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 text-left"
          >
            <span className="w-5 h-5 rounded border-2 border-gray-300 flex-shrink-0" />
            <span className="flex-1 text-gray-900">
              <span className="font-medium">{ingredient.name}</span>
              {(ingredient.quantity || ingredient.unit) && (
                <span className="text-gray-400 text-sm"> — {ingredient.quantity} {ingredient.unit}</span>
              )}
            </span>
          </button>
        ))}

        {done.length > 0 && (
          <>
            <p className="text-xs text-gray-400 pt-2 pl-1">Done ({done.length})</p>
            {done.map(ingredient => (
              <button
                key={ingredient.name}
                onClick={() => toggle(ingredient.name.toLowerCase())}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 text-left opacity-50"
              >
                <span className="w-5 h-5 rounded border-2 border-emerald-400 bg-emerald-400 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className="flex-1 text-gray-400 line-through">{ingredient.name}</span>
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
```

**Step 3: Verify in browser**

- Add a few dishes to this week's menu
- Visit /shopping-list → aggregated ingredients shown
- Tap items → checked items move to "Done" section
- Refresh → checked state persists (localStorage)

**Step 4: Commit**

```bash
git add src/app/shopping-list/
git commit -m "feat: add shopping list page with persistent checklist"
```

---

### Task 13: History Page

**Files:**
- Create: `src/app/history/page.tsx`
- Create: `src/app/history/[menuId]/page.tsx`
- Create: `src/app/history/[menuId]/AddToWeekButton.tsx`

**Step 1: Create history list page**

Create `src/app/history/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import { getWeekStartString, formatWeekLabel } from '@/lib/utils/dates'
import Link from 'next/link'

export default async function HistoryPage() {
  const supabase = await createClient()
  const currentWeekStart = getWeekStartString()

  const { data: menus } = await supabase
    .from('weekly_menus')
    .select('*')
    .neq('week_start_date', currentWeekStart)
    .order('week_start_date', { ascending: false })

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">History</h1>
      {!menus?.length ? (
        <div className="text-center py-16 text-gray-400">
          <p>No past weeks yet</p>
          <p className="text-sm mt-1">Your history will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {menus.map(menu => (
            <Link
              key={menu.id}
              href={`/history/${menu.id}`}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100"
            >
              <span className="font-medium text-gray-900">{formatWeekLabel(menu.week_start_date)}</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Create history week detail page**

Create `src/app/history/[menuId]/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'
import { formatWeekLabel } from '@/lib/utils/dates'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AddToWeekButton from './AddToWeekButton'
import type { MenuRecipeWithRecipe } from '@/types'

export default async function HistoryWeekPage({
  params,
}: {
  params: Promise<{ menuId: string }>
}) {
  const { menuId } = await params
  const supabase = await createClient()

  const { data: menu } = await supabase.from('weekly_menus').select('*').eq('id', menuId).single()
  if (!menu) notFound()

  const { data: menuRecipes } = await supabase
    .from('menu_recipes')
    .select('*, recipe:recipes(*)')
    .eq('menu_id', menuId)
    .order('added_at')

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/history" className="text-gray-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold">{formatWeekLabel(menu.week_start_date)}</h1>
      </div>

      {!menuRecipes?.length ? (
        <p className="text-gray-400 text-center py-8">No dishes this week</p>
      ) : (
        <div className="space-y-3">
          {(menuRecipes as MenuRecipeWithRecipe[]).map(mr => (
            <div key={mr.id} className="flex gap-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {mr.recipe.image_url ? (
                  <img src={mr.recipe.image_url} alt={mr.recipe.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No img</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">{mr.recipe.title}</h3>
                <AddToWeekButton recipeId={mr.recipe.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 3: Create AddToWeekButton**

Create `src/app/history/[menuId]/AddToWeekButton.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getWeekStartString } from '@/lib/utils/dates'

export default function AddToWeekButton({ recipeId }: { recipeId: string }) {
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const router = useRouter()

  async function addToThisWeek() {
    setAdding(true)
    const supabase = createClient()
    const weekStart = getWeekStartString()

    let { data: menu } = await supabase
      .from('weekly_menus')
      .select('id')
      .eq('week_start_date', weekStart)
      .single()

    if (!menu) {
      const { data } = await supabase
        .from('weekly_menus')
        .insert({ week_start_date: weekStart })
        .select('id')
        .single()
      menu = data
    }

    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('menu_recipes').upsert(
      { menu_id: menu!.id, recipe_id: recipeId, added_by: user!.id },
      { onConflict: 'menu_id,recipe_id' }
    )

    setAdded(true)
    setAdding(false)
    router.refresh()
  }

  if (added) return <p className="text-xs text-emerald-600 mt-1">Added to this week!</p>

  return (
    <button
      onClick={addToThisWeek}
      disabled={adding}
      className="text-xs text-emerald-600 font-medium mt-1 disabled:opacity-50"
    >
      {adding ? 'Adding...' : '+ Add to this week'}
    </button>
  )
}
```

**Step 4: Verify in browser**

- History tab shows list of past weeks
- Tap a week → see dishes
- "+ Add to this week" adds dish to current week's menu

**Step 5: Commit**

```bash
git add src/app/history/
git commit -m "feat: add history page with re-add to current week"
```

---

### Task 14: PWA Configuration

**Files:**
- Create: `public/manifest.json`
- Create: `public/icons/icon-192x192.png` (manual)
- Create: `public/icons/icon-512x512.png` (manual)
- Modify: `next.config.ts`

**Step 1: Create app icons (manual)**

```bash
mkdir -p public/icons
```

Generate icons using https://www.pwabuilder.com/imageGenerator:
1. Upload any food/plate image (or any square image you like)
2. Download the generated icon pack
3. Copy `android/android-launchericon-192-192.png` → `public/icons/icon-192x192.png`
4. Copy `android/android-launchericon-512-512.png` → `public/icons/icon-512x512.png`

**Step 2: Create manifest.json**

Create `public/manifest.json`:
```json
{
  "name": "Meal Prep",
  "short_name": "Meal Prep",
  "description": "Plan your weekly meals together",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#059669",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Step 3: Update next.config.ts**

Read `next.config.ts` first, then replace with:
```typescript
import type { NextConfig } from 'next'

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

const nextConfig: NextConfig = {}

module.exports = withPWA(nextConfig)
```

**Step 4: Verify build passes**

Run: `npm run build`
Expected: Build succeeds with no errors. PWA files generated in `public/`.

**Step 5: Commit**

```bash
git add public/manifest.json public/icons/ next.config.ts
git commit -m "feat: add PWA manifest, icons, and service worker"
```

---

### Task 15: Deploy to Vercel

**Step 1: Push to GitHub**

Create a new repository at https://github.com/new (name: `meal-prep`, private).

Then:
```bash
git remote add origin https://github.com/<your-username>/meal-prep.git
git branch -M main
git push -u origin main
```

**Step 2: Deploy on Vercel**

1. Go to https://vercel.com — sign in with GitHub
2. Click "Add New Project" → Import `meal-prep` repository
3. Framework: Next.js (auto-detected)
4. Click "Deploy" — first deploy will fail because env vars are missing

**Step 3: Add environment variables**

In Vercel project → Settings → Environment Variables, add:
- `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key

Then: Deployments → Redeploy (with existing build cache).

**Step 4: Update Supabase auth URLs**

In Supabase dashboard → Authentication → URL Configuration:
- Site URL: `https://your-app.vercel.app`
- Add to Redirect URLs: `https://your-app.vercel.app/auth/callback`

**Step 5: Verify production**

- Visit `https://your-app.vercel.app`
- Sign in with Google
- Test all tabs: Menu, Recipes, List, History
- Add a recipe, add it to the week, check the shopping list

**Step 6: Install PWA on iPhone**

1. Open `https://your-app.vercel.app` in Safari on iPhone
2. Tap the Share button (square with arrow pointing up)
3. Tap "Add to Home Screen"
4. Tap "Add"
5. App icon appears on home screen — opens full screen

**Step 7: Share with wife**

Send her the Vercel URL. She opens in Safari → Add to Home Screen → done. Both of you have the app installed for free.

---

## All Tests

Run full test suite at any time:
```bash
npm test
```

Expected: All tests pass (dates utilities + shopping aggregation).
