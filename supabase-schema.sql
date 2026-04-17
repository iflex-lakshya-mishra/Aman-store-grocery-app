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
