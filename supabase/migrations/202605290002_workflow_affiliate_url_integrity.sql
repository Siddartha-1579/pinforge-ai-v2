alter table public.generated_pins
  add column if not exists affiliate_url text;

alter table public.pin_queue
  add column if not exists affiliate_url text;

update public.generated_pins pins
set affiliate_url = links.url
from public.affiliate_links links
where pins.affiliate_link_id = links.id
  and pins.affiliate_url is null;

update public.pin_queue queue
set affiliate_url = coalesce(pins.affiliate_url, links.url)
from public.generated_pins pins
left join public.affiliate_links links on links.id = pins.affiliate_link_id
where queue.pin_id = pins.id
  and queue.affiliate_url is null;

create index if not exists pins_user_affiliate_link_idx on public.generated_pins(user_id, affiliate_link_id);
create index if not exists pin_queue_user_affiliate_link_idx on public.pin_queue(user_id, affiliate_link_id);
