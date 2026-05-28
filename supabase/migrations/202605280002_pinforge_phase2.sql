alter table public.generated_pins
  add column if not exists status text not null default 'Draft' check (status in ('Draft', 'Ready', 'Scheduled', 'Published', 'Failed')),
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

alter table public.pin_queue enable row level security;
alter table public.upload_sessions enable row level security;
alter table public.analytics_events enable row level security;

create policy "Users manage own pin queue" on public.pin_queue
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own upload sessions" on public.upload_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own analytics events" on public.analytics_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists pin_queue_user_status_idx on public.pin_queue(user_id, status, scheduled_at);
create index if not exists pin_queue_user_scheduled_idx on public.pin_queue(user_id, scheduled_at);
create index if not exists upload_sessions_user_created_idx on public.upload_sessions(user_id, created_at desc);
create index if not exists analytics_events_user_created_idx on public.analytics_events(user_id, created_at desc);
