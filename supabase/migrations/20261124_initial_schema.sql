-- Applied to the "dietbuddy" Supabase project as "dietbuddy_initial_schema".
-- profiles: one row per user (goal, body details, daily targets). meal_logs: one row per logged meal.
-- Row level security: each user can only read and write their own rows. ai_calls is server-only (no policies).
-- consume_ai_quota(): called by the analyze-meal edge function (6 requests/minute, 80/day per user).
-- delete_my_account(): in-app account deletion; all user data is removed by cascade.

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  goal text not null check (goal in ('bulking','cutting','maintain')),
  sex text not null check (sex in ('male','female')),
  age integer not null check (age between 13 and 100),
  height_cm numeric not null check (height_cm between 100 and 250),
  weight_kg numeric not null check (weight_kg between 30 and 300),
  activity text not null check (activity in ('sedentary','light','moderate','active')),
  calories integer not null check (calories between 800 and 6000),
  protein integer not null check (protein between 0 and 500),
  carbs integer not null check (carbs between 0 and 1000),
  fat integer not null check (fat between 0 and 400),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "own profile insert" on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own profile update" on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  logged_at timestamptz not null default now(),
  source text not null check (source in ('text','image','audio')),
  food_name text not null check (char_length(food_name) between 1 and 200),
  transcript text check (transcript is null or char_length(transcript) <= 2000),
  calories integer not null check (calories between 0 and 10000),
  protein numeric not null default 0 check (protein between 0 and 1000),
  carbs numeric not null default 0 check (carbs between 0 and 1500),
  fat numeric not null default 0 check (fat between 0 and 1000),
  confidence text check (confidence in ('high','medium','low')),
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now()
);
create index meal_logs_user_time_idx on public.meal_logs (user_id, logged_at desc);
alter table public.meal_logs enable row level security;
create policy "own meals select" on public.meal_logs for select to authenticated using ((select auth.uid()) = user_id);
create policy "own meals insert" on public.meal_logs for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own meals update" on public.meal_logs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own meals delete" on public.meal_logs for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on public.profiles, public.meal_logs from anon;

create table public.ai_calls (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index ai_calls_user_time_idx on public.ai_calls (user_id, created_at desc);
alter table public.ai_calls enable row level security;
revoke all on public.ai_calls from anon, authenticated;

create or replace function public.consume_ai_quota() returns boolean
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return false; end if;
  if (select count(*) from public.ai_calls where user_id = uid and created_at > now() - interval '1 minute') >= 6
     or (select count(*) from public.ai_calls where user_id = uid and created_at > now() - interval '24 hours') >= 80 then
    return false;
  end if;
  insert into public.ai_calls (user_id) values (uid);
  delete from public.ai_calls where user_id = uid and created_at < now() - interval '2 days';
  return true;
end $$;
revoke all on function public.consume_ai_quota() from public, anon;
grant execute on function public.consume_ai_quota() to authenticated;

create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
