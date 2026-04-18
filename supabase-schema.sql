-- Profiles table migration for auth upgrade
-- Run this in Supabase SQL Editor

-- Enable RLS on auth.users if not already
alter table auth.users enable row level security;

-- Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  phone text,
  address text,
  location text,
  role text default 'user',
  updated_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles add column if not exists role text default 'user';

-- RLS policies
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "read own" on public.profiles;
drop policy if exists "insert own" on public.profiles;
drop policy if exists "update own" on public.profiles;

create policy "read own" on public.profiles for select using (auth.uid() = id);
create policy "insert own" on public.profiles for insert with check (auth.uid() = id);
create policy "update own" on public.profiles for update using (auth.uid() = id);

update public.profiles
set role = 'admin'
where id = (
  select id
  from auth.users
  where email = 'guptamartstationary911@gmail.com'
);

-- Indexes
create index if not exists profiles_id_idx on public.profiles using btree (id);

-- Trigger for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at 
  before update on public.profiles 
  for each row execute procedure public.handle_updated_at();

-- =====================================
-- CATEGORIES TABLE + RLS POLICIES (NEW)
-- =====================================

-- Create categories table if not exists
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone
);

-- Enable RLS
alter table public.categories enable row level security;

-- Drop existing policies if any (safe)
drop policy if exists "Public read categories" on public.categories;
drop policy if exists "Admin manage categories" on public.categories;

-- Policies:
-- Public can read all categories (for Home page display)
create policy "Public read categories" on public.categories 
  for select using (true);

-- Admins can fully manage (create/update/delete)
create policy "Admin manage categories" on public.categories 
  for all 
  using (exists (
    select 1 from public.profiles 
    where id = auth.uid() and role = 'admin'
  ))
  with check (exists (
    select 1 from public.profiles 
    where id = auth.uid() and role = 'admin'
  ));

-- Index for performance
create index if not exists categories_name_idx on public.categories using btree (name);

-- Reuse updated_at trigger for categories
create trigger categories_updated_at 
  before update on public.categories 
  for each row execute procedure public.handle_updated_at();

-- =====================================
-- STORAGE BUCKET POLICIES (NEW)
-- =====================================
-- IMPORTANT: Run these in Supabase Dashboard > Storage > Policies or SQL Editor

-- Enable RLS on storage.objects if not already (run once)
-- alter table storage.objects enable row level security;

-- Categories bucket policies
drop policy if exists "Public read categories images" on storage.objects;
drop policy if exists "Authenticated upload categories images" on storage.objects;
drop policy if exists "Admin manage categories images" on storage.objects;

create policy "Public read categories images" on storage.objects
  for select using (bucket_id = 'categories');

create policy "Authenticated upload categories images" on storage.objects
  for insert with check (bucket_id = 'categories');

create policy "Admin manage categories images" on storage.objects
  for update, delete using (bucket_id = 'categories')
  with check (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

-- Product-images bucket (similar, for completeness)
create policy "Public read product images" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "Authenticated upload product images" on storage.objects
  for insert with check (bucket_id = 'product-images');

create policy "Admin manage product images" on storage.objects
  for update, delete using (bucket_id = 'product-images')
  with check (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

-- =====================================
-- USAGE INSTRUCTIONS
-- =====================================
-- 1. Copy ALL above SQL and run in Supabase Dashboard > SQL Editor
-- 2. Create buckets if missing: Storage > New bucket ('categories', 'product-images') - public: NO
-- 3. Add sample data: INSERT INTO categories (name) VALUES ('Grocery'), ('Fruits');
-- 4. Test: npm run dev → Home page should show categories from Supabase
