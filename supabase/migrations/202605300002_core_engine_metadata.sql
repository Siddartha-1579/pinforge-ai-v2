alter table public.products
  add column if not exists import_source_url text,
  add column if not exists resolved_url text,
  add column if not exists brand text,
  add column if not exists features text[] not null default '{}',
  add column if not exists product_image_url text;

alter table public.generated_pins
  add column if not exists keywords text[] not null default '{}',
  add column if not exists hashtags text[] not null default '{}';

update public.products
set import_source_url = affiliate_url
where import_source_url is null
  and affiliate_url is not null;

update public.products
set resolved_url = affiliate_url
where resolved_url is null
  and affiliate_url is not null;

update public.generated_pins pins
set
  keywords = products.keywords,
  hashtags = products.hashtags
from public.products products
where pins.product_id = products.id
  and coalesce(cardinality(pins.keywords), 0) = 0
  and coalesce(cardinality(products.keywords), 0) > 0;

create index if not exists products_user_resolved_url_idx on public.products(user_id, resolved_url);
create index if not exists products_user_brand_idx on public.products(user_id, brand);
