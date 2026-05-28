alter table public.user_settings
  add column if not exists auto_publish_enabled boolean not null default false,
  add column if not exists max_pins_per_day integer not null default 5,
  add column if not exists upload_time_windows text not null default '09:00-11:00, 16:00-18:00',
  add column if not exists retry_limits integer not null default 2,
  add column if not exists publishing_delay_minutes integer not null default 15,
  add column if not exists queue_priority text not null default 'Oldest First',
  add column if not exists automation_paused boolean not null default false,
  add column if not exists emergency_stop boolean not null default false;

create table if not exists public.pinterest_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pinterest_user_id text,
  username text,
  display_name text,
  connected boolean not null default true,
  token_expires_at timestamptz,
  last_refreshed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('pinterest')),
  account_id uuid references public.pinterest_accounts(id) on delete cascade,
  encrypted_access_token bytea not null,
  encrypted_refresh_token bytea,
  expires_at timestamptz,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.publishing_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  queue_item_id uuid not null references public.pin_queue(id) on delete cascade,
  pin_id uuid not null references public.generated_pins(id) on delete cascade,
  status text not null default 'Pending' check (status in ('Pending', 'Processing', 'Published', 'Failed', 'Retrying')),
  retry_count integer not null default 0,
  max_retries integer not null default 2,
  last_error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.upload_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid references public.publishing_jobs(id) on delete set null,
  pin_id uuid references public.generated_pins(id) on delete set null,
  level text not null check (level in ('info', 'warn', 'error')),
  message text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.trend_intelligence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null,
  product_name text not null,
  opportunity_score integer not null check (opportunity_score between 0 and 100),
  competition_estimate text not null check (competition_estimate in ('Low', 'Medium', 'High')),
  evergreen boolean not null default false,
  reasoning text not null,
  created_at timestamptz not null default now()
);

alter table public.pinterest_accounts enable row level security;
alter table public.oauth_tokens enable row level security;
alter table public.publishing_jobs enable row level security;
alter table public.upload_logs enable row level security;
alter table public.trend_intelligence enable row level security;

create policy "Users manage own pinterest account metadata" on public.pinterest_accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users read own publishing jobs" on public.publishing_jobs
  for select using (auth.uid() = user_id);
create policy "Users insert own publishing jobs" on public.publishing_jobs
  for insert with check (auth.uid() = user_id);
create policy "Users update own publishing jobs" on public.publishing_jobs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users read own upload logs" on public.upload_logs
  for select using (auth.uid() = user_id);
create policy "Users insert own upload logs" on public.upload_logs
  for insert with check (auth.uid() = user_id);

create policy "Users manage own trend intelligence" on public.trend_intelligence
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists pinterest_accounts_user_idx on public.pinterest_accounts(user_id, connected);
create index if not exists oauth_tokens_account_idx on public.oauth_tokens(account_id, provider, revoked);
create index if not exists publishing_jobs_user_status_idx on public.publishing_jobs(user_id, status, created_at desc);
create index if not exists upload_logs_user_level_idx on public.upload_logs(user_id, level, created_at desc);
create index if not exists trend_intelligence_user_created_idx on public.trend_intelligence(user_id, created_at desc);
