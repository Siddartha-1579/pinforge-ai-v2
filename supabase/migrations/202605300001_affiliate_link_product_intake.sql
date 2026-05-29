alter table public.products
  add column if not exists affiliate_url text,
  add column if not exists affiliate_network text,
  add column if not exists short_description text,
  add column if not exists benefits text[] not null default '{}',
  add column if not exists keywords text[] not null default '{}',
  add column if not exists hashtags text[] not null default '{}';

update public.products products
set
  affiliate_url = links.url,
  affiliate_network = links.network
from public.affiliate_links links
where links.product_id = products.id
  and products.affiliate_url is null;

update public.generated_pins pins
set affiliate_url = products.affiliate_url
from public.products products
where pins.product_id = products.id
  and pins.affiliate_url is null
  and products.affiliate_url is not null;

update public.pin_queue queue
set affiliate_url = products.affiliate_url
from public.products products
where queue.product_id = products.id
  and queue.affiliate_url is null
  and products.affiliate_url is not null;

create index if not exists products_user_affiliate_url_idx on public.products(user_id, affiliate_url);
create index if not exists products_user_affiliate_network_idx on public.products(user_id, affiliate_network);
