-- Run this once in your Supabase project's SQL Editor (Database > SQL Editor).

-- 1. Table: meals
create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  image_url text not null,
  foods jsonb not null default '[]'::jsonb,
  total_calories numeric not null default 0,
  protein numeric not null default 0,
  carbs numeric not null default 0,
  fat numeric not null default 0,
  health_score numeric not null default 0,
  summary text,
  created_at timestamptz not null default now()
);

create index if not exists meals_user_id_created_at_idx
  on public.meals (user_id, created_at desc);

alter table public.meals enable row level security;

drop policy if exists "Users can view their own meals" on public.meals;
create policy "Users can view their own meals"
  on public.meals for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own meals" on public.meals;
create policy "Users can insert their own meals"
  on public.meals for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own meals" on public.meals;
create policy "Users can update their own meals"
  on public.meals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own meals" on public.meals;
create policy "Users can delete their own meals"
  on public.meals for delete
  using (auth.uid() = user_id);

-- 2. Storage bucket: meal-photos
insert into storage.buckets (id, name, public)
values ('meal-photos', 'meal-photos', true)
on conflict (id) do nothing;

-- Photos are stored under a path like "<user_id>/<filename>" so ownership
-- can be checked from the first path segment.
drop policy if exists "Meal photos are publicly readable" on storage.objects;
create policy "Meal photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'meal-photos');

drop policy if exists "Users can upload their own meal photos" on storage.objects;
create policy "Users can upload their own meal photos"
  on storage.objects for insert
  with check (
    bucket_id = 'meal-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can update their own meal photos" on storage.objects;
create policy "Users can update their own meal photos"
  on storage.objects for update
  using (
    bucket_id = 'meal-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete their own meal photos" on storage.objects;
create policy "Users can delete their own meal photos"
  on storage.objects for delete
  using (
    bucket_id = 'meal-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
