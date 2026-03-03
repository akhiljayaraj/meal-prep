-- ============================================================
-- Migration 001: Initial schema
-- Project: meal-prep PWA
-- ============================================================

-- recipes table
create table if not exists public.recipes (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  image_url text,
  ingredients jsonb not null default '[]',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- weekly_menus table
create table if not exists public.weekly_menus (
  id uuid default gen_random_uuid() primary key,
  week_start_date date not null unique,
  created_at timestamptz default now()
);

-- menu_recipes join table
create table if not exists public.menu_recipes (
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
create policy if not exists "auth_select_recipes" on public.recipes for select to authenticated using (true);
create policy if not exists "auth_insert_recipes" on public.recipes for insert to authenticated with check (true);
create policy if not exists "auth_update_recipes" on public.recipes for update to authenticated using (true);
create policy if not exists "auth_delete_recipes" on public.recipes for delete to authenticated using (true);

create policy if not exists "auth_select_menus" on public.weekly_menus for select to authenticated using (true);
create policy if not exists "auth_insert_menus" on public.weekly_menus for insert to authenticated with check (true);

create policy if not exists "auth_select_menu_recipes" on public.menu_recipes for select to authenticated using (true);
create policy if not exists "auth_insert_menu_recipes" on public.menu_recipes for insert to authenticated with check (true);
create policy if not exists "auth_delete_menu_recipes" on public.menu_recipes for delete to authenticated using (true);

-- ============================================================
-- Storage: recipe-images bucket policies
-- (Bucket must be created manually in the Supabase dashboard
--  as a public bucket named "recipe-images")
-- ============================================================

create policy if not exists "auth_upload_images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'recipe-images');

create policy if not exists "public_read_images"
  on storage.objects for select to public
  using (bucket_id = 'recipe-images');
