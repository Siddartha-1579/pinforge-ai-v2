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
  created_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  global_pin_instructions text not null,
  brand_tone text not null,
  cta_preferences text not null,
  visual_style_preferences text not null,
  content_guidelines text not null,
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.affiliate_links enable row level security;
alter table public.generated_pins enable row level security;
alter table public.user_settings enable row level security;

create policy "Users manage own products" on public.products
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own affiliate links" on public.affiliate_links
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own generated pins" on public.generated_pins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own settings" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists products_user_created_idx on public.products(user_id, created_at desc);
create index if not exists links_user_created_idx on public.affiliate_links(user_id, created_at desc);
create index if not exists pins_user_created_idx on public.generated_pins(user_id, created_at desc);
