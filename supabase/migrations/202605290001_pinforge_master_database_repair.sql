create extension if not exists "pgcrypto";

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  price_range text not null,
  virality_score integer not null check (virality_score between 0 and 100),
  competition_level text not null check (competition_level in ('Low', 'Medium', 'High')),
  affiliate_potential integer not null check (affiliate_potential between 0 and 100),
  trend_reasoning text not null,
  target_audience text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.affiliate_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  network text not null default 'Amazon',
  url text not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.generated_pins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  affiliate_link_id uuid references public.affiliate_links(id) on delete set null,
  style text not null,
  title text not null,
  description text not null,
  cta text not null,
  emotional_trigger text not null,
  marketing_angle text not null,
  image_data_url text,
  uploaded boolean not null default false,
  status text not null default 'Draft' check (status in ('Draft', 'Ready', 'Scheduled', 'Published', 'Failed')),
  notes text,
  pinterest_url text,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  global_pin_instructions text not null default 'Keep pins useful, honest, and focused on clear benefits. Avoid unsupported claims.',
  brand_tone text not null default 'Helpful' check (brand_tone in ('Helpful', 'Premium', 'Warm', 'Bold', 'Minimal')),
  cta_preferences text not null default 'Save this idea, Shop the product, Try it this week',
  visual_style_preferences text not null default 'Bright product-first layouts with readable typography',
  content_guidelines text not null default 'Use affiliate disclosures where appropriate and avoid misleading urgency.',
  auto_publish_enabled boolean not null default false,
  max_pins_per_day integer not null default 5 check (max_pins_per_day between 1 and 50),
  upload_time_windows text not null default '09:00-11:00, 16:00-18:00',
  retry_limits integer not null default 2 check (retry_limits between 0 and 10),
  publishing_delay_minutes integer not null default 15 check (publishing_delay_minutes between 0 and 240),
  queue_priority text not null default 'Oldest First' check (queue_priority in ('Oldest First', 'Newest First', 'Highest Affiliate Potential')),
  automation_paused boolean not null default false,
  emergency_stop boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.user_settings
  add column if not exists auto_publish_enabled boolean not null default false,
  add column if not exists max_pins_per_day integer not null default 5,
  add column if not exists upload_time_windows text not null default '09:00-11:00, 16:00-18:00',
  add column if not exists retry_limits integer not null default 2,
  add column if not exists publishing_delay_minutes integer not null default 15,
  add column if not exists queue_priority text not null default 'Oldest First',
  add column if not exists automation_paused boolean not null default false,
  add column if not exists emergency_stop boolean not null default false;

alter table public.generated_pins
  add column if not exists status text not null default 'Draft',
  add column if not exists notes text,
  add column if not exists pinterest_url text,
  add column if not exists published_at timestamptz;

create table if not exists public.pin_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pin_id uuid not null references public.generated_pins(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  affiliate_link_id uuid references public.affiliate_links(id) on delete set null,
  scheduled_at timestamptz,
  status text not null default 'Draft' check (status in ('Draft', 'Ready', 'Scheduled', 'Published', 'Failed')),
  notes text,
  created_at timestamptz not null default now(),
  unique(pin_id)
);

create table if not exists public.upload_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  status text not null default 'Active' check (status in ('Active', 'Completed', 'Archived')),
  pin_ids uuid[] not null default '{}',
  uploaded_count integer not null default 0,
  pending_count integer not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  pin_id uuid references public.generated_pins(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

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

alter table public.products enable row level security;
alter table public.affiliate_links enable row level security;
alter table public.generated_pins enable row level security;
alter table public.user_settings enable row level security;
alter table public.pin_queue enable row level security;
alter table public.upload_sessions enable row level security;
alter table public.analytics_events enable row level security;
alter table public.pinterest_accounts enable row level security;
alter table public.oauth_tokens enable row level security;
alter table public.publishing_jobs enable row level security;
alter table public.upload_logs enable row level security;
alter table public.trend_intelligence enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'products' and policyname = 'Users manage own products') then
    create policy "Users manage own products" on public.products for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'affiliate_links' and policyname = 'Users manage own affiliate links') then
    create policy "Users manage own affiliate links" on public.affiliate_links for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'generated_pins' and policyname = 'Users manage own generated pins') then
    create policy "Users manage own generated pins" on public.generated_pins for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_settings' and policyname = 'Users manage own settings') then
    create policy "Users manage own settings" on public.user_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'pin_queue' and policyname = 'Users manage own pin queue') then
    create policy "Users manage own pin queue" on public.pin_queue for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'upload_sessions' and policyname = 'Users manage own upload sessions') then
    create policy "Users manage own upload sessions" on public.upload_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'analytics_events' and policyname = 'Users manage own analytics events') then
    create policy "Users manage own analytics events" on public.analytics_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'pinterest_accounts' and policyname = 'Users manage own pinterest account metadata') then
    create policy "Users manage own pinterest account metadata" on public.pinterest_accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'oauth_tokens' and policyname = 'Deny client access to oauth tokens') then
    create policy "Deny client access to oauth tokens" on public.oauth_tokens for all using (false) with check (false);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'publishing_jobs' and policyname = 'Users read own publishing jobs') then
    create policy "Users read own publishing jobs" on public.publishing_jobs for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'publishing_jobs' and policyname = 'Users insert own publishing jobs') then
    create policy "Users insert own publishing jobs" on public.publishing_jobs for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'publishing_jobs' and policyname = 'Users update own publishing jobs') then
    create policy "Users update own publishing jobs" on public.publishing_jobs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'upload_logs' and policyname = 'Users read own upload logs') then
    create policy "Users read own upload logs" on public.upload_logs for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'upload_logs' and policyname = 'Users insert own upload logs') then
    create policy "Users insert own upload logs" on public.upload_logs for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'trend_intelligence' and policyname = 'Users manage own trend intelligence') then
    create policy "Users manage own trend intelligence" on public.trend_intelligence for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists products_user_created_idx on public.products(user_id, created_at desc);
create index if not exists links_user_created_idx on public.affiliate_links(user_id, created_at desc);
create index if not exists links_user_product_idx on public.affiliate_links(user_id, product_id);
create index if not exists pins_user_created_idx on public.generated_pins(user_id, created_at desc);
create index if not exists pins_user_status_idx on public.generated_pins(user_id, status, created_at desc);
create index if not exists pin_queue_user_status_idx on public.pin_queue(user_id, status, scheduled_at);
create index if not exists pin_queue_user_scheduled_idx on public.pin_queue(user_id, scheduled_at);
create index if not exists pin_queue_pin_id_idx on public.pin_queue(pin_id);
create index if not exists upload_sessions_user_created_idx on public.upload_sessions(user_id, created_at desc);
create index if not exists analytics_events_user_created_idx on public.analytics_events(user_id, created_at desc);
create index if not exists analytics_events_user_pin_idx on public.analytics_events(user_id, pin_id);
create index if not exists pinterest_accounts_user_idx on public.pinterest_accounts(user_id, connected);
create index if not exists oauth_tokens_account_idx on public.oauth_tokens(account_id, provider, revoked);
create index if not exists oauth_tokens_user_provider_idx on public.oauth_tokens(user_id, provider, revoked);
create index if not exists publishing_jobs_user_status_idx on public.publishing_jobs(user_id, status, created_at desc);
create index if not exists publishing_jobs_queue_item_idx on public.publishing_jobs(queue_item_id);
create index if not exists upload_logs_user_level_idx on public.upload_logs(user_id, level, created_at desc);
create index if not exists upload_logs_user_pin_idx on public.upload_logs(user_id, pin_id);
create index if not exists trend_intelligence_user_created_idx on public.trend_intelligence(user_id, created_at desc);

insert into public.user_settings (
  user_id,
  global_pin_instructions,
  brand_tone,
  cta_preferences,
  visual_style_preferences,
  content_guidelines,
  auto_publish_enabled,
  max_pins_per_day,
  upload_time_windows,
  retry_limits,
  publishing_delay_minutes,
  queue_priority,
  automation_paused,
  emergency_stop
)
select users.id
  , 'Keep pins useful, honest, and focused on clear benefits. Avoid unsupported claims.'
  , 'Helpful'
  , 'Save this idea, Shop the product, Try it this week'
  , 'Bright product-first layouts with readable typography'
  , 'Use affiliate disclosures where appropriate and avoid misleading urgency.'
  , false
  , 5
  , '09:00-11:00, 16:00-18:00'
  , 2
  , 15
  , 'Oldest First'
  , false
  , false
from auth.users
where not exists (
  select 1
  from public.user_settings settings
  where settings.user_id = users.id
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pin-assets', 'pin-assets', false, 5242880, array['image/png', 'image/jpeg'])
on conflict (id) do nothing;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Users manage own pin assets') then
    create policy "Users manage own pin assets" on storage.objects
      for all
      using (bucket_id = 'pin-assets' and auth.uid()::text = (storage.foldername(name))[1])
      with check (bucket_id = 'pin-assets' and auth.uid()::text = (storage.foldername(name))[1]);
  end if;
end $$;
