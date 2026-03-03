# Meal Prep App — Design Document
**Date:** 2026-03-02

## Overview

A collaborative meal planning PWA for two people (husband and wife) to manage a shared recipe library, plan next week's menu together, and generate an aggregated shopping list. Hosted on Vercel (free), data on Supabase (free), installable on iPhone via PWA.

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js (App Router) | First-class Vercel support, React ecosystem, easy PWA setup, Capacitor-compatible later |
| Styling | Tailwind CSS | Fast to build, great mobile-first support |
| Auth | Supabase Auth (Google OAuth) | Free, no password management, per-user identity |
| Database | Supabase Postgres | Free tier (500MB), real-time, row-level security |
| File Storage | Supabase Storage | Free tier (1GB), for uploaded recipe photos |
| Hosting | Vercel (free tier) | Made by Next.js team, zero config deployment |
| PWA | next-pwa + manifest.json | Installable on iPhone via Safari "Add to Home Screen" |

---

## Architecture

```
iPhone (Safari)          Wife's iPhone (Safari)
      |                          |
      └──────────┬───────────────┘
                 ↓
         Vercel (free tier)
         Next.js App Router
         PWA (manifest + service worker)
                 ↓
         Supabase (free tier)
         ├── Auth (Google OAuth)
         ├── Postgres DB (recipes, menus)
         └── Storage (recipe photos)
```

- Single Next.js codebase — serves website and installable PWA
- No custom backend — Supabase client calls directly from browser
- All infrastructure is free tier; no credit card required

---

## Pages & Navigation

Bottom navigation bar (mobile-first, 4 tabs):

| Tab | Route | Purpose |
|-----|-------|---------|
| Menu | `/` | Current week's picked dishes |
| Recipes | `/recipes` | Browse and manage recipe library |
| List | `/shopping-list` | Aggregated shopping list for current week |
| History | `/history` | Past weekly menus |

Additional routes:
- `/recipes/new` — Add a new recipe
- `/recipes/[id]` — View / edit a single recipe

---

## Data Model

### `recipes`
```
id            uuid        primary key
title         text        required
description   text
image_url     text        URL (external) or Supabase Storage path (upload)
ingredients   jsonb       [{ name: string, quantity: string, unit: string }]
created_by    uuid        → auth.users.id
created_at    timestamp
```

### `weekly_menus`
```
id              uuid      primary key
week_start_date date      always a Monday (e.g. 2026-03-02)
created_at      timestamp
```

### `menu_recipes`
```
id          uuid      primary key
menu_id     uuid      → weekly_menus.id
recipe_id   uuid      → recipes.id
added_by    uuid      → auth.users.id
added_at    timestamp
```

> Shopping list is computed on the fly — no stored table. Flatten all `ingredients` arrays from the current week's recipes, group by name, sum quantities.

### Security
- Supabase Row Level Security (RLS) on all tables
- Only authenticated users can read/write
- All data is shared between both users (no per-user isolation needed)

---

## Feature Details

### Adding a Recipe
- Fields: title, description, ingredients (name + quantity + unit, add one by one), photo
- Photo: upload from device OR paste an external URL
- Saved to Supabase; appears in recipe library immediately

### Weekly Menu (Menu tab)
- Displays current week (Mon–Sun)
- "Add dish" → opens recipe picker from library
- Either person can add or remove dishes freely
- Week auto-advances: new `weekly_menus` row created on Monday automatically

### Shopping List (List tab)
- Computed from all recipes in current week's menu
- Ingredients aggregated by name (e.g., "Onion — 3", "Garlic — 5 cloves")
- Checklist UI — tap to check off while shopping
- Checked state stored in localStorage; resets at start of new week

### History tab
- List of past weeks in reverse chronological order (e.g., "Week of Feb 23")
- Tap a week → see the dishes picked that week
- "Add to this week" button on each dish for easy re-use

### PWA Install
- `manifest.json` with app name, icons, theme colour
- Service worker for offline caching of visited pages
- First visit on iPhone Safari → prompt to "Add to Home Screen"
- Installed: full screen, no browser chrome, home screen icon

---

## Constraints & Non-Goals

- No serving size scaling — ingredients listed as fixed quantities
- No meal categories, tags, or search (can add later)
- No push notifications
- No in-app messaging between users
- Supabase free tier limits: 500MB DB, 1GB storage, 50k MAU — well within limits for 2 users
