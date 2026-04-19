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
-- ORDERS TABLE + RLS (required for admin order list)
-- =====================================
-- If RLS is ON and you have ZERO policies, Supabase blocks ALL inserts/selects — table stays empty.
-- Without "select for admin", buyers' rows exist in DB but the admin UI stays empty (RLS).

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending',
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(14, 2) default 0,
  delivery_fee numeric(14, 2) default 0,
  total_price numeric(14, 2) default 0,
  user_name text,
  user_mobile text,
  user_address text,
  user_email text,
  lat double precision,
  lng double precision,
  address text,
  delivery_name text,
  delivery_phone text,
  delivery_address text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.orders add column if not exists delivery_name text;
alter table public.orders add column if not exists delivery_phone text;
alter table public.orders add column if not exists delivery_address text;
alter table public.orders add column if not exists delivery_fee numeric(14, 2);
alter table public.orders add column if not exists subtotal numeric(14, 2);
alter table public.orders add column if not exists items jsonb;
-- App checkout sends these too; minimal tables often omit them and inserts fail (table stays empty).
alter table public.orders add column if not exists user_name text;
alter table public.orders add column if not exists user_mobile text;
alter table public.orders add column if not exists user_address text;
alter table public.orders add column if not exists lat double precision;
alter table public.orders add column if not exists lng double precision;
alter table public.orders add column if not exists address text;
alter table public.orders add column if not exists total_price numeric(14, 2);
alter table public.orders add column if not exists status text;
alter table public.orders add column if not exists user_email text;
alter table public.orders add column if not exists created_at timestamptz default timezone('utc'::text, now());

alter table public.orders enable row level security;

-- Re-run from here if order status update/delete fails for admin (RLS): policies now allow
-- profiles.role ilike 'admin' OR JWT email guptamartstationary911@gmail.com (same as the app).

drop policy if exists "orders_select_own_or_admin" on public.orders;
drop policy if exists "orders_insert_own_email" on public.orders;
drop policy if exists "orders_update_admin" on public.orders;
drop policy if exists "orders_delete_admin" on public.orders;

-- Matches app admin (useCurrentUser.js): profiles.role = 'admin' (any case) OR owner email.
create policy "orders_select_own_or_admin" on public.orders
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and lower(trim(coalesce(p.role, ''))) = 'admin'
    )
    or lower(trim(coalesce(auth.jwt() ->> 'email', ''))) = 'guptamartstationary911@gmail.com'
    or lower(trim(coalesce(user_email, ''))) = lower(trim(coalesce(
      (select u.email::text from auth.users u where u.id = auth.uid()),
      ''
    )))
  );

-- Only insert rows tied to the signed-in user's email (prevents spoofing).
create policy "orders_insert_own_email" on public.orders
  for insert with check (
    auth.uid() is not null
    and lower(trim(coalesce(user_email, ''))) = lower(trim(coalesce(
      (select u.email::text from auth.users u where u.id = auth.uid()),
      ''
    )))
  );

create policy "orders_update_admin" on public.orders
  for update using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and lower(trim(coalesce(p.role, ''))) = 'admin'
    )
    or lower(trim(coalesce(auth.jwt() ->> 'email', ''))) = 'guptamartstationary911@gmail.com'
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and lower(trim(coalesce(p.role, ''))) = 'admin'
    )
    or lower(trim(coalesce(auth.jwt() ->> 'email', ''))) = 'guptamartstationary911@gmail.com'
  );

create policy "orders_delete_admin" on public.orders
  for delete using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and lower(trim(coalesce(p.role, ''))) = 'admin'
    )
    or lower(trim(coalesce(auth.jwt() ->> 'email', ''))) = 'guptamartstationary911@gmail.com'
  );

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_user_email_idx on public.orders (user_email);

-- =====================================
-- SETTINGS TABLE + RLS (app reads app_logo; admin may upsert)
-- =====================================
-- RLS ON with no policies => logo/settings API returns nothing.

create table if not exists public.settings (
  id int primary key generated always as identity,
  app_logo text,
  updated_at timestamptz default timezone('utc'::text, now())
);

alter table public.settings enable row level security;

drop policy if exists "settings_select_all" on public.settings;
drop policy if exists "settings_upsert_admin" on public.settings;

create policy "settings_select_all" on public.settings
  for select using (true);

create policy "settings_upsert_admin" on public.settings
  for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and lower(trim(coalesce(p.role, ''))) = 'admin'
    )
    or lower(trim(coalesce(auth.jwt() ->> 'email', ''))) = 'guptamartstationary911@gmail.com'
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and lower(trim(coalesce(p.role, ''))) = 'admin'
    )
    or lower(trim(coalesce(auth.jwt() ->> 'email', ''))) = 'guptamartstationary911@gmail.com'
  );

-- =====================================
-- USAGE INSTRUCTIONS
-- =====================================
-- 1. Copy ALL above SQL and run in Supabase Dashboard > SQL Editor
-- 2. Create buckets if missing: Storage > New bucket ('categories', 'product-images') - public: NO
-- 3. Add sample data: INSERT INTO categories (name) VALUES ('Grocery'), ('Fruits');
-- 4. Test: npm run dev → Home page should show categories from Supabase
-- 5. If Policies page shows "no RLS policies exist" on orders: run the ORDERS TABLE + RLS block above in SQL Editor (not optional).
-- 6. Same for settings if logo/admin save fails: run SETTINGS TABLE + RLS above.
